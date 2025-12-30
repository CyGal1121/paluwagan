"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./group";

/**
 * Mark payout as sent (organizer only)
 */
export async function markPayoutSent(
  payoutId: string,
  note?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get payout
  const { data: payout } = await supabase
    .from("payouts")
    .select("*, cycles(group_id)")
    .eq("id", payoutId)
    .single();

  if (!payout) {
    return { success: false, error: "Payout not found" };
  }

  const groupId = (payout.cycles as { group_id: string }).group_id;

  // Verify user is organizer
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "organizer") {
    return { success: false, error: "Only organizers can mark payout as sent" };
  }

  // Update payout
  const { error } = await supabase
    .from("payouts")
    .update({
      status: "sent_by_organizer",
      sent_at: new Date().toISOString(),
      note: note || null,
    })
    .eq("id", payoutId);

  if (error) {
    console.error("Mark sent error:", error);
    return { success: false, error: "Failed to update payout" };
  }

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "payout",
    entity_id: payoutId,
    action: "mark_sent",
    metadata_json: { recipient_user_id: payout.recipient_user_id },
  });

  // Notify recipient
  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  await supabase.from("notifications").insert({
    user_id: payout.recipient_user_id,
    group_id: groupId,
    type: "payout_sent",
    title: "Payout Sent!",
    message: `The organizer has marked your payout for ${group?.name || "the group"} as sent. Please confirm when received.`,
    data_json: { payout_id: payoutId },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Confirm payout received (recipient only)
 */
export async function confirmPayoutReceived(
  payoutId: string,
  note?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get payout
  const { data: payout } = await supabase
    .from("payouts")
    .select("*, cycles(group_id)")
    .eq("id", payoutId)
    .single();

  if (!payout) {
    return { success: false, error: "Payout not found" };
  }

  // Verify user is the recipient
  if (payout.recipient_user_id !== user.id) {
    return { success: false, error: "Only the recipient can confirm payout" };
  }

  const groupId = (payout.cycles as { group_id: string }).group_id;

  // Update payout
  const { error } = await supabase
    .from("payouts")
    .update({
      status: "confirmed_by_recipient",
      confirmed_at: new Date().toISOString(),
      note: note || payout.note,
    })
    .eq("id", payoutId);

  if (error) {
    console.error("Confirm received error:", error);
    return { success: false, error: "Failed to confirm payout" };
  }

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "payout",
    entity_id: payoutId,
    action: "confirm_received",
    metadata_json: {},
  });

  // Get group details for notification
  const { data: group } = await supabase
    .from("groups")
    .select("organizer_user_id, name")
    .eq("id", groupId)
    .single();

  // Notify organizer
  if (group) {
    const { data: recipient } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();

    await supabase.from("notifications").insert({
      user_id: group.organizer_user_id,
      group_id: groupId,
      type: "payout_confirmed",
      title: "Payout Confirmed",
      message: `${recipient?.name || "The recipient"} confirmed receiving the payout for ${group.name}`,
      data_json: { payout_id: payoutId },
    });
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Dispute payout
 */
export async function disputePayout(
  payoutId: string,
  reason: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get payout
  const { data: payout } = await supabase
    .from("payouts")
    .select("*, cycles(group_id)")
    .eq("id", payoutId)
    .single();

  if (!payout) {
    return { success: false, error: "Payout not found" };
  }

  const groupId = (payout.cycles as { group_id: string }).group_id;

  // Verify user is organizer or recipient
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  const isOrganizer = membership?.role === "organizer";
  const isRecipient = payout.recipient_user_id === user.id;

  if (!isOrganizer && !isRecipient) {
    return { success: false, error: "Not authorized to dispute" };
  }

  // Update payout
  const { error } = await supabase
    .from("payouts")
    .update({
      status: "disputed",
      note: reason,
    })
    .eq("id", payoutId);

  if (error) {
    console.error("Dispute payout error:", error);
    return { success: false, error: "Failed to dispute payout" };
  }

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "payout",
    entity_id: payoutId,
    action: "dispute",
    metadata_json: { reason, disputed_by: isOrganizer ? "organizer" : "recipient" },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
