"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addDays, addWeeks, addMonths } from "date-fns";
import type { ActionResult } from "./group";

/**
 * Calculate cycle dates based on frequency
 */
function calculateCycleDates(
  startDate: Date,
  cycleNumber: number,
  frequency: "weekly" | "biweekly" | "monthly"
): { start: Date; due: Date } {
  let cycleStart: Date;
  let cycleDue: Date;

  switch (frequency) {
    case "weekly":
      cycleStart = addWeeks(startDate, cycleNumber - 1);
      cycleDue = addDays(cycleStart, 6);
      break;
    case "biweekly":
      cycleStart = addWeeks(startDate, (cycleNumber - 1) * 2);
      cycleDue = addDays(cycleStart, 13);
      break;
    case "monthly":
      cycleStart = addMonths(startDate, cycleNumber - 1);
      cycleDue = addDays(addMonths(startDate, cycleNumber), -1);
      break;
  }

  return { start: cycleStart, due: cycleDue };
}

/**
 * Assign payout positions based on method
 */
function assignPayoutOrder(
  members: { user_id: string; payout_position: number | null }[],
  method: "fixed" | "lottery" | "organizer_assigned"
): { user_id: string; position: number }[] {
  const assignments: { user_id: string; position: number }[] = [];

  switch (method) {
    case "fixed":
      // Sort by existing position (join order), then by user_id for consistency
      const sortedMembers = [...members].sort((a, b) => {
        if (a.payout_position && b.payout_position) {
          return a.payout_position - b.payout_position;
        }
        if (a.payout_position) return -1;
        if (b.payout_position) return 1;
        return a.user_id.localeCompare(b.user_id);
      });
      sortedMembers.forEach((m, i) => {
        assignments.push({ user_id: m.user_id, position: i + 1 });
      });
      break;

    case "lottery":
      // Random shuffle using Fisher-Yates
      const shuffled = [...members];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      shuffled.forEach((m, i) => {
        assignments.push({ user_id: m.user_id, position: i + 1 });
      });
      break;

    case "organizer_assigned":
      // Use existing positions if set, otherwise assign in order
      const withPositions = members.filter((m) => m.payout_position !== null);
      const withoutPositions = members.filter((m) => m.payout_position === null);

      withPositions.forEach((m) => {
        assignments.push({ user_id: m.user_id, position: m.payout_position! });
      });

      let nextPosition = Math.max(...assignments.map((a) => a.position), 0) + 1;
      withoutPositions.forEach((m) => {
        assignments.push({ user_id: m.user_id, position: nextPosition++ });
      });
      break;
  }

  return assignments.sort((a, b) => a.position - b.position);
}

/**
 * Start a group - activate it and generate cycles
 */
export async function startGroup(groupId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get group details
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) {
    return { success: false, error: "Group not found" };
  }

  // Verify user is organizer
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "organizer") {
    return { success: false, error: "Only organizers can start groups" };
  }

  if (group.status !== "forming") {
    return { success: false, error: "Group has already started" };
  }

  // Get all active members
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, payout_position")
    .eq("group_id", groupId)
    .eq("status", "active");

  if (!members || members.length < 2) {
    return { success: false, error: "Need at least 2 active members to start" };
  }

  // Assign payout order
  const payoutOrder = assignPayoutOrder(
    members,
    group.payout_order_method as "fixed" | "lottery" | "organizer_assigned"
  );

  // Update member payout positions
  for (const assignment of payoutOrder) {
    await supabase
      .from("group_members")
      .update({ payout_position: assignment.position })
      .eq("group_id", groupId)
      .eq("user_id", assignment.user_id);
  }

  // Generate cycles based on number of members
  const startDate = new Date(group.start_date);
  const cycleCount = group.members_limit;

  const cyclesToInsert = [];
  for (let i = 1; i <= cycleCount; i++) {
    const { start, due } = calculateCycleDates(
      startDate,
      i,
      group.frequency as "weekly" | "biweekly" | "monthly"
    );

    // Find the member for this cycle
    const cycleRecipient = payoutOrder.find((p) => p.position === i);

    cyclesToInsert.push({
      group_id: groupId,
      cycle_number: i,
      start_date: start.toISOString().split("T")[0],
      due_date: due.toISOString().split("T")[0],
      payout_user_id: cycleRecipient?.user_id || null,
      status: i === 1 ? "open" : "upcoming",
    });
  }

  const { error: cyclesError } = await supabase.from("cycles").insert(cyclesToInsert);

  if (cyclesError) {
    console.error("Cycles creation error:", cyclesError);
    return { success: false, error: "Failed to generate cycles" };
  }

  // Create contributions for the first cycle
  const { data: firstCycle } = await supabase
    .from("cycles")
    .select("id")
    .eq("group_id", groupId)
    .eq("cycle_number", 1)
    .single();

  if (firstCycle) {
    const contributionsToInsert = members.map((m) => ({
      group_id: groupId,
      cycle_id: firstCycle.id,
      user_id: m.user_id,
      amount: group.contribution_amount,
      status: "unpaid",
    }));

    await supabase.from("contributions").insert(contributionsToInsert);

    // Create payout record
    const firstRecipient = payoutOrder.find((p) => p.position === 1);
    if (firstRecipient) {
      await supabase.from("payouts").insert({
        cycle_id: firstCycle.id,
        group_id: groupId,
        recipient_user_id: firstRecipient.user_id,
        amount: group.contribution_amount * members.length,
        status: "scheduled",
      });
    }
  }

  // Update group status to active
  const { error: updateError } = await supabase
    .from("groups")
    .update({ status: "active" })
    .eq("id", groupId);

  if (updateError) {
    console.error("Group update error:", updateError);
    return { success: false, error: "Failed to activate group" };
  }

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "group",
    entity_id: groupId,
    action: "start",
    metadata_json: {
      member_count: members.length,
      cycle_count: cycleCount,
      payout_order: payoutOrder,
    },
  });

  // Notify all members
  for (const member of members) {
    const position = payoutOrder.find((p) => p.user_id === member.user_id)?.position;
    await supabase.from("notifications").insert({
      user_id: member.user_id,
      group_id: groupId,
      type: "group_started",
      title: "Group Started!",
      message: `${group.name} has started. You are in position ${position} for payout.`,
      data_json: { payout_position: position },
    });
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Advance to the next cycle (close current, open next)
 */
export async function advanceCycle(groupId: string): Promise<ActionResult> {
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
    return { success: false, error: "Only organizers can advance cycles" };
  }

  // Get current open cycle
  const { data: currentCycle } = await supabase
    .from("cycles")
    .select("*")
    .eq("group_id", groupId)
    .eq("status", "open")
    .single();

  if (!currentCycle) {
    return { success: false, error: "No open cycle found" };
  }

  // Close current cycle
  await supabase
    .from("cycles")
    .update({ status: "closed" })
    .eq("id", currentCycle.id);

  // Open next cycle
  const { data: nextCycle } = await supabase
    .from("cycles")
    .select("*")
    .eq("group_id", groupId)
    .eq("cycle_number", currentCycle.cycle_number + 1)
    .single();

  if (nextCycle) {
    await supabase
      .from("cycles")
      .update({ status: "open" })
      .eq("id", nextCycle.id);

    // Get active members
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("status", "active");

    // Get group details for contribution amount
    const { data: group } = await supabase
      .from("groups")
      .select("contribution_amount")
      .eq("id", groupId)
      .single();

    if (members && group) {
      // Create contributions for new cycle
      const contributionsToInsert = members.map((m) => ({
        group_id: groupId,
        cycle_id: nextCycle.id,
        user_id: m.user_id,
        amount: group.contribution_amount,
        status: "unpaid",
      }));

      await supabase.from("contributions").insert(contributionsToInsert);

      // Create payout record
      if (nextCycle.payout_user_id) {
        await supabase.from("payouts").insert({
          cycle_id: nextCycle.id,
          group_id: groupId,
          recipient_user_id: nextCycle.payout_user_id,
          amount: group.contribution_amount * members.length,
          status: "scheduled",
        });
      }
    }
  } else {
    // No more cycles - group is complete
    await supabase
      .from("groups")
      .update({ status: "completed" })
      .eq("id", groupId);
  }

  // Create audit log
  await supabase.from("audit_logs").insert({
    group_id: groupId,
    actor_user_id: user.id,
    entity_type: "cycle",
    entity_id: currentCycle.id,
    action: "close",
    metadata_json: { cycle_number: currentCycle.cycle_number },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
