"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createGroupSchema, type CreateGroupInput } from "@/lib/validations/group";
import { nanoid } from "nanoid";
import { addDays, addWeeks, addMonths } from "date-fns";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

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

  // Create the group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      organizer_user_id: user.id,
      name: data.name,
      contribution_amount: data.contribution_amount,
      frequency: data.frequency,
      start_date: data.start_date,
      members_limit: data.members_limit,
      payout_order_method: data.payout_order_method,
      rules_json: data.rules_json || {},
      status: "forming",
    })
    .select("id")
    .single();

  if (groupError || !group) {
    console.error("Group creation error:", groupError);
    return { success: false, error: "Failed to create group" };
  }

  // Add organizer as first member
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

  // Get group details to check rules
  const { data: group } = await supabase
    .from("groups")
    .select("id, rules_json, members_limit")
    .eq("id", invite.group_id)
    .single();

  if (!group) {
    return { success: false, error: "Group not found" };
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
