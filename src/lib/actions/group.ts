"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createGroupSchema, type CreateGroupInput } from "@/lib/validations/group";
import { nanoid } from "nanoid";
import { addDays, addWeeks, addMonths } from "date-fns";
import { BRANCH_FEES, BRANCH_SLOTS, MEMBERSHIP_LIMITS, calculateMonthlyEquivalent } from "@/types/database";
import { sendEmail, generateInviteEmailHtml, generateInviteEmailText } from "@/lib/email";
import { sendSms, generateInviteSmsMessage, isValidPhoneNumber, normalizePhoneNumber } from "@/lib/sms";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Membership validation types
export type MembershipValidationResult = {
  canJoin: boolean;
  reason?: string;
  currentBranches: number;
  currentMonthlyTotal: number;
  projectedMonthlyTotal: number;
};

export type MembershipSummary = {
  branchCount: number;
  monthlyContributionTotal: number;
  remainingBranches: number;
  remainingMonthlyBudget: number;
  branches: Array<{
    id: string;
    name: string;
    contributionAmount: number;
    frequency: "weekly" | "biweekly" | "monthly";
    monthlyEquivalent: number;
  }>;
};

// Get user's current membership summary
export async function getUserMembershipSummary(userId: string): Promise<MembershipSummary> {
  const supabase = await createClient();

  // Get all active/pending memberships with group details
  const { data: memberships } = await supabase
    .from("group_members")
    .select(`
      group_id,
      groups (
        id,
        name,
        contribution_amount,
        frequency
      )
    `)
    .eq("user_id", userId)
    .in("status", ["active", "pending"]);

  const branches: MembershipSummary["branches"] = [];
  let monthlyTotal = 0;

  if (memberships) {
    for (const membership of memberships) {
      const group = membership.groups as unknown as {
        id: string;
        name: string;
        contribution_amount: number;
        frequency: "weekly" | "biweekly" | "monthly";
      };

      if (group) {
        const monthlyEquivalent = calculateMonthlyEquivalent(
          group.contribution_amount,
          group.frequency
        );
        monthlyTotal += monthlyEquivalent;
        branches.push({
          id: group.id,
          name: group.name,
          contributionAmount: group.contribution_amount,
          frequency: group.frequency,
          monthlyEquivalent,
        });
      }
    }
  }

  return {
    branchCount: branches.length,
    monthlyContributionTotal: monthlyTotal,
    remainingBranches: Math.max(0, MEMBERSHIP_LIMITS.MAX_BRANCHES - branches.length),
    remainingMonthlyBudget: Math.max(0, MEMBERSHIP_LIMITS.MAX_MONTHLY_CONTRIBUTION - monthlyTotal),
    branches,
  };
}

// Validate if user can join a new branch
export async function validateMembershipLimits(
  userId: string,
  newContributionAmount: number,
  newFrequency: "weekly" | "biweekly" | "monthly"
): Promise<MembershipValidationResult> {
  const summary = await getUserMembershipSummary(userId);

  const newMonthlyEquivalent = calculateMonthlyEquivalent(newContributionAmount, newFrequency);
  const projectedMonthlyTotal = summary.monthlyContributionTotal + newMonthlyEquivalent;

  // Check branch limit
  if (summary.branchCount >= MEMBERSHIP_LIMITS.MAX_BRANCHES) {
    return {
      canJoin: false,
      reason: `You have reached the maximum of ${MEMBERSHIP_LIMITS.MAX_BRANCHES} branches. Please leave a branch before joining a new one.`,
      currentBranches: summary.branchCount,
      currentMonthlyTotal: summary.monthlyContributionTotal,
      projectedMonthlyTotal,
    };
  }

  // Check contribution limit
  if (projectedMonthlyTotal > MEMBERSHIP_LIMITS.MAX_MONTHLY_CONTRIBUTION) {
    const formatted = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    });

    return {
      canJoin: false,
      reason: `Joining this branch would exceed your monthly contribution limit of ${formatted.format(MEMBERSHIP_LIMITS.MAX_MONTHLY_CONTRIBUTION)}. Current: ${formatted.format(summary.monthlyContributionTotal)}, New branch: ${formatted.format(newMonthlyEquivalent)}/month.`,
      currentBranches: summary.branchCount,
      currentMonthlyTotal: summary.monthlyContributionTotal,
      projectedMonthlyTotal,
    };
  }

  return {
    canJoin: true,
    currentBranches: summary.branchCount,
    currentMonthlyTotal: summary.monthlyContributionTotal,
    projectedMonthlyTotal,
  };
}

export async function createGroup(input: CreateGroupInput): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  // Validate input
  const validationResult = createGroupSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors[0].message,
    };
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const data = validationResult.data;

  // Create the group (branch)
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      organizer_user_id: user.id,
      name: data.name,
      contribution_amount: data.contribution_amount,
      frequency: data.frequency,
      start_date: data.start_date,
      members_limit: BRANCH_SLOTS, // Fixed 10 slots per branch
      payout_order_method: data.payout_order_method,
      rules_json: data.rules_json || {},
      status: "forming",
      category_id: data.category_id || null,
      organizer_fee_type: data.organizer_fee_type || "percentage",
      organizer_fee_value: data.organizer_fee_value || 5,
    })
    .select("id")
    .single();

  if (groupError || !group) {
    console.error("Group creation error:", groupError);
    return { success: false, error: "Failed to create group" };
  }

  // Add organizer as member only if they chose to join
  if (data.organizer_joins) {
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      role: "organizer",
      status: "active",
      payout_position: 1,
    });

    if (memberError) {
      console.error("Member creation error:", memberError);
      // Cleanup: delete the group
      await supabase.from("groups").delete().eq("id", group.id);
      return { success: false, error: "Failed to add organizer as member" };
    }
  }

  // Create setup fee for the branch
  const { error: feeError } = await supabase.from("branch_fees").insert({
    branch_id: group.id,
    fee_type: "setup",
    amount: BRANCH_FEES.SETUP,
    status: "unpaid",
  });

  if (feeError) {
    console.error("Fee creation error:", feeError);
    // Non-fatal error, continue
  }

  // Create audit log entry
  await supabase.from("audit_logs").insert({
    group_id: group.id,
    actor_user_id: user.id,
    entity_type: "group",
    entity_id: group.id,
    action: "create",
    metadata_json: {
      name: data.name,
      contribution_amount: data.contribution_amount,
      frequency: data.frequency,
      members_limit: data.members_limit,
      organizer_fee_type: data.organizer_fee_type,
      organizer_fee_value: data.organizer_fee_value,
    },
  });

  revalidatePath("/home");
  return { success: true, data: { id: group.id } };
}

export async function createInvite(
  groupId: string,
  maxUses?: number
): Promise<ActionResult<{ token: string; url: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is organizer
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "organizer") {
    return { success: false, error: "Only organizers can create invites" };
  }

  const token = nanoid(12);
  const expiresAt = addDays(new Date(), 7); // 7 day expiration

  const { error } = await supabase.from("invites").insert({
    group_id: groupId,
    token,
    created_by: user.id,
    expires_at: expiresAt.toISOString(),
    max_uses: maxUses || null,
  });

  if (error) {
    console.error("Invite creation error:", error);
    return { success: false, error: "Failed to create invite" };
  }

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "invite",
    entity_id: token,
    action: "create",
    metadata_json: { max_uses: maxUses, expires_at: expiresAt.toISOString() },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}/invites/${token}`;

  return { success: true, data: { token, url } };
}

export async function joinGroup(token: string): Promise<ActionResult<{ groupId: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get invite details
  const { data: invite } = await supabase
    .from("invites")
    .select("id, group_id, expires_at, max_uses, use_count")
    .eq("token", token)
    .single();

  if (!invite) {
    return { success: false, error: "Invalid invite link" };
  }

  // Check expiration
  if (new Date(invite.expires_at) < new Date()) {
    return { success: false, error: "This invite has expired" };
  }

  // Check max uses
  if (invite.max_uses && invite.use_count >= invite.max_uses) {
    return { success: false, error: "This invite has reached its maximum uses" };
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from("group_members")
    .select("id, status")
    .eq("group_id", invite.group_id)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    if (existingMember.status === "removed") {
      return { success: false, error: "You have been removed from this group" };
    }
    return { success: false, error: "You are already a member of this group" };
  }

  // Get group details to check rules and contribution amount
  const { data: group } = await supabase
    .from("groups")
    .select("id, rules_json, members_limit, contribution_amount, frequency")
    .eq("id", invite.group_id)
    .single();

  if (!group) {
    return { success: false, error: "Group not found" };
  }

  // Check user's membership limits (max branches and monthly contribution)
  const membershipValidation = await validateMembershipLimits(
    user.id,
    group.contribution_amount,
    group.frequency
  );

  if (!membershipValidation.canJoin) {
    return { success: false, error: membershipValidation.reason };
  }

  // Check member limit
  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", invite.group_id)
    .in("status", ["active", "pending"]);

  if (count && count >= group.members_limit) {
    return { success: false, error: "This group is full" };
  }

  // Determine if auto-approve
  const rules = group.rules_json as { auto_approve_members?: boolean } | null;
  const autoApprove = rules?.auto_approve_members ?? false;

  // Add as member
  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: invite.group_id,
    user_id: user.id,
    role: "member",
    status: autoApprove ? "active" : "pending",
  });

  if (memberError) {
    console.error("Join error:", memberError);
    return { success: false, error: "Failed to join group" };
  }

  // Increment invite use count
  await supabase
    .from("invites")
    .update({ use_count: invite.use_count + 1 })
    .eq("id", invite.id);

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: invite.group_id,
    actor_user_id: user.id,
    entity_type: "member",
    entity_id: user.id,
    action: autoApprove ? "join" : "join_request",
    metadata_json: { invite_token: token },
  });

  // Create notification for organizer
  const { data: groupData } = await supabase
    .from("groups")
    .select("organizer_user_id, name")
    .eq("id", invite.group_id)
    .single();

  if (groupData) {
    const { data: joiningUser } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();

    await supabase.from("notifications").insert({
      user_id: groupData.organizer_user_id,
      group_id: invite.group_id,
      type: autoApprove ? "member_joined" : "join_request",
      title: autoApprove ? "New Member Joined" : "New Join Request",
      message: `${joiningUser?.name || "Someone"} ${autoApprove ? "joined" : "wants to join"} ${groupData.name}`,
      data_json: { user_id: user.id },
    });
  }

  revalidatePath("/home");
  return { success: true, data: { groupId: invite.group_id } };
}

export async function approveMember(
  groupId: string,
  userId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is organizer
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "organizer") {
    return { success: false, error: "Only organizers can approve members" };
  }

  // Update member status
  const { error } = await supabase
    .from("group_members")
    .update({ status: "active" })
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) {
    console.error("Approve error:", error);
    return { success: false, error: "Failed to approve member" };
  }

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "member",
    entity_id: userId,
    action: "approve",
    metadata_json: {},
  });

  // Notify the approved member
  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  await supabase.from("notifications").insert({
    user_id: userId,
    group_id: groupId,
    type: "membership_approved",
    title: "Membership Approved",
    message: `You have been approved to join ${group?.name || "the group"}`,
    data_json: {},
  });

  revalidatePath(`/groups/${groupId}/members`);
  return { success: true };
}

export async function removeMember(
  groupId: string,
  userId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is organizer
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "organizer") {
    return { success: false, error: "Only organizers can remove members" };
  }

  // Can't remove yourself as organizer
  if (userId === user.id) {
    return { success: false, error: "Cannot remove yourself as organizer" };
  }

  // Update member status
  const { error } = await supabase
    .from("group_members")
    .update({ status: "removed" })
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) {
    console.error("Remove error:", error);
    return { success: false, error: "Failed to remove member" };
  }

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "member",
    entity_id: userId,
    action: "remove",
    metadata_json: {},
  });

  revalidatePath(`/groups/${groupId}/members`);
  return { success: true };
}

export async function freezeMember(
  groupId: string,
  userId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is organizer
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "organizer") {
    return { success: false, error: "Only organizers can freeze members" };
  }

  // Update member status
  const { error } = await supabase
    .from("group_members")
    .update({ status: "frozen" })
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    console.error("Freeze error:", error);
    return { success: false, error: "Failed to freeze member" };
  }

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "member",
    entity_id: userId,
    action: "freeze",
    metadata_json: {},
  });

  revalidatePath(`/groups/${groupId}/members`);
  return { success: true };
}

export async function unfreezeMember(
  groupId: string,
  userId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is organizer
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "organizer") {
    return { success: false, error: "Only organizers can unfreeze members" };
  }

  // Update member status from frozen to active
  const { error } = await supabase
    .from("group_members")
    .update({ status: "active" })
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("status", "frozen");

  if (error) {
    console.error("Unfreeze error:", error);
    return { success: false, error: "Failed to unfreeze member" };
  }

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "member",
    entity_id: userId,
    action: "unfreeze",
    metadata_json: {},
  });

  revalidatePath(`/groups/${groupId}/members`);
  return { success: true };
}

export async function sendEmailInvite(
  groupId: string,
  email: string
): Promise<ActionResult<{ token: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  // Get group details and verify organizer - organizer check now checks groups table directly
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, contribution_amount, frequency, organizer_user_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    return { success: false, error: "Branch not found" };
  }

  if (group.organizer_user_id !== user.id) {
    return { success: false, error: "Only organizers can send invites" };
  }

  // Get inviter's name
  const { data: inviter } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  // Check if email already has an active invite
  const { data: existingInvite } = await supabase
    .from("invites")
    .select("id, token, expires_at")
    .eq("group_id", groupId)
    .eq("email", email)
    .gt("expires_at", new Date().toISOString())
    .single();

  let token: string;

  if (existingInvite) {
    // Resend existing invite
    token = existingInvite.token;
  } else {
    // Create new invite
    token = nanoid(12);
    const expiresAt = addDays(new Date(), 7);

    const { error: inviteError } = await supabase.from("invites").insert({
      group_id: groupId,
      token,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
      max_uses: 1,
      email,
      status: "pending",
    });

    if (inviteError) {
      console.error("Invite creation error:", inviteError);
      return { success: false, error: "Failed to create invite" };
    }
  }

  // Generate invite URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invites/${token}`;

  // Send email
  const emailResult = await sendEmail({
    to: email,
    subject: `${inviter?.name || "Someone"} invited you to join ${group.name} on Pinoy Paluwagan`,
    html: generateInviteEmailHtml({
      inviterName: inviter?.name || "An organizer",
      branchName: group.name,
      contributionAmount: group.contribution_amount,
      frequency: group.frequency,
      inviteUrl,
    }),
    text: generateInviteEmailText({
      inviterName: inviter?.name || "An organizer",
      branchName: group.name,
      contributionAmount: group.contribution_amount,
      frequency: group.frequency,
      inviteUrl,
    }),
  });

  if (!emailResult.success) {
    return { success: false, error: emailResult.error || "Failed to send email" };
  }

  // Update invite status to sent
  await supabase
    .from("invites")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("token", token);

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "invite",
    entity_id: token,
    action: "email_sent",
    metadata_json: { email, sent_at: new Date().toISOString() },
  });

  return { success: true, data: { token } };
}

export async function sendSmsInvite(
  groupId: string,
  phone: string
): Promise<ActionResult<{ token: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate phone number format
  if (!isValidPhoneNumber(phone)) {
    return { success: false, error: "Please enter a valid Philippine mobile number (e.g., 09171234567)" };
  }

  const normalizedPhone = normalizePhoneNumber(phone);

  // Get group details and verify organizer
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, contribution_amount, frequency, organizer_user_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    return { success: false, error: "Branch not found" };
  }

  if (group.organizer_user_id !== user.id) {
    return { success: false, error: "Only organizers can send invites" };
  }

  // Get inviter's name
  const { data: inviter } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  // Check if phone already has an active invite
  const { data: existingInvite } = await supabase
    .from("invites")
    .select("id, token, expires_at")
    .eq("group_id", groupId)
    .eq("phone", normalizedPhone)
    .gt("expires_at", new Date().toISOString())
    .single();

  let token: string;

  if (existingInvite) {
    // Resend existing invite
    token = existingInvite.token;
  } else {
    // Create new invite
    token = nanoid(12);
    const expiresAt = addDays(new Date(), 7);

    const { error: inviteError } = await supabase.from("invites").insert({
      group_id: groupId,
      token,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
      max_uses: 1,
      phone: normalizedPhone,
      invite_method: "sms",
      status: "pending",
    });

    if (inviteError) {
      console.error("Invite creation error:", inviteError);
      return { success: false, error: "Failed to create invite" };
    }
  }

  // Generate invite URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invites/${token}`;

  // Send SMS
  const smsResult = await sendSms({
    to: normalizedPhone,
    message: generateInviteSmsMessage({
      inviterName: inviter?.name || "Someone",
      branchName: group.name,
      contributionAmount: group.contribution_amount,
      frequency: group.frequency,
      inviteUrl,
    }),
  });

  if (!smsResult.success) {
    return { success: false, error: smsResult.error || "Failed to send SMS" };
  }

  // Update invite status to sent
  await supabase
    .from("invites")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("token", token);

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "invite",
    entity_id: token,
    action: "sms_sent",
    metadata_json: { phone: normalizedPhone, sent_at: new Date().toISOString() },
  });

  return { success: true, data: { token } };
}
