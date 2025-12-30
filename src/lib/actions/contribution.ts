"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./group";

/**
 * Submit contribution with optional proof
 */
export async function submitContribution(
  contributionId: string,
  proofUrl?: string,
  note?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get contribution
  const { data: contribution } = await supabase
    .from("contributions")
    .select("*, cycles(group_id, due_date)")
    .eq("id", contributionId)
    .single();

  if (!contribution) {
    return { success: false, error: "Contribution not found" };
  }

  // Verify user owns this contribution
  if (contribution.user_id !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  // Check if late
  const dueDate = new Date((contribution.cycles as { due_date: string }).due_date);
  const isLate = new Date() > dueDate;

  // Update contribution
  const { error } = await supabase
    .from("contributions")
    .update({
      status: proofUrl ? "pending_proof" : "pending_proof",
      proof_url: proofUrl || null,
      note: note || null,
      is_late: isLate,
    })
    .eq("id", contributionId);

  if (error) {
    console.error("Submit error:", error);
    return { success: false, error: "Failed to submit contribution" };
  }

  const groupId = (contribution.cycles as { group_id: string }).group_id;

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "contribution",
    entity_id: contributionId,
    action: "submit",
    metadata_json: { has_proof: !!proofUrl, is_late: isLate },
  });

  // Notify organizer
  const { data: group } = await supabase
    .from("groups")
    .select("organizer_user_id, name")
    .eq("id", groupId)
    .single();

  if (group) {
    const { data: submitter } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();

    await supabase.from("notifications").insert({
      user_id: group.organizer_user_id,
      group_id: groupId,
      type: "contribution_submitted",
      title: "Contribution Submitted",
      message: `${submitter?.name || "A member"} submitted their contribution for ${group.name}`,
      data_json: { contribution_id: contributionId },
    });
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Confirm a contribution (organizer only)
 */
export async function confirmContribution(
  contributionId: string,
  note?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get contribution with group info
  const { data: contribution } = await supabase
    .from("contributions")
    .select("*, cycles(group_id)")
    .eq("id", contributionId)
    .single();

  if (!contribution) {
    return { success: false, error: "Contribution not found" };
  }

  const groupId = (contribution.cycles as { group_id: string }).group_id;

  // Verify user is organizer
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "organizer") {
    return { success: false, error: "Only organizers can confirm contributions" };
  }

  // Update contribution
  const { error } = await supabase
    .from("contributions")
    .update({
      status: "paid_confirmed",
      confirmed_by_user_id: user.id,
      note: note || contribution.note,
    })
    .eq("id", contributionId);

  if (error) {
    console.error("Confirm error:", error);
    return { success: false, error: "Failed to confirm contribution" };
  }

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "contribution",
    entity_id: contributionId,
    action: "confirm",
    metadata_json: { member_user_id: contribution.user_id },
  });

  // Notify the member
  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  await supabase.from("notifications").insert({
    user_id: contribution.user_id,
    group_id: groupId,
    type: "contribution_confirmed",
    title: "Contribution Confirmed",
    message: `Your contribution for ${group?.name || "the group"} has been confirmed`,
    data_json: { contribution_id: contributionId },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Dispute a contribution
 */
export async function disputeContribution(
  contributionId: string,
  reason: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get contribution with group info
  const { data: contribution } = await supabase
    .from("contributions")
    .select("*, cycles(group_id)")
    .eq("id", contributionId)
    .single();

  if (!contribution) {
    return { success: false, error: "Contribution not found" };
  }

  const groupId = (contribution.cycles as { group_id: string }).group_id;

  // Verify user is organizer or the contributor
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  const isOrganizer = membership?.role === "organizer";
  const isContributor = contribution.user_id === user.id;

  if (!isOrganizer && !isContributor) {
    return { success: false, error: "Not authorized to dispute" };
  }

  // Update contribution
  const { error } = await supabase
    .from("contributions")
    .update({
      status: "disputed",
      note: reason,
    })
    .eq("id", contributionId);

  if (error) {
    console.error("Dispute error:", error);
    return { success: false, error: "Failed to dispute contribution" };
  }

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "contribution",
    entity_id: contributionId,
    action: "dispute",
    metadata_json: { reason, disputed_by: isOrganizer ? "organizer" : "member" },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Upload proof image to storage
 */
export async function uploadProof(
  groupId: string,
  file: File
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Only JPEG, PNG, and WebP images are allowed" };
  }

  // Verify file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File size must be less than 5MB" };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${groupId}/${user.id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("proofs")
    .upload(fileName, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { success: false, error: "Failed to upload proof" };
  }

  const { data } = supabase.storage.from("proofs").getPublicUrl(fileName);

  return { success: true, data: { url: data.publicUrl } };
}
