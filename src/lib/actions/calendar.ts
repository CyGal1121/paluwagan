"use server";

import { createClient } from "@/lib/supabase/server";
import type { Cycle, User } from "@/types/database";
import { calculateNetPayout } from "@/types/database";

export type CalendarEvent = {
  id: string;
  date: string;
  type: "contribution_due" | "payout";
  cycleNumber: number;
  amount: number;
  status: string;
  payoutUser?: Pick<User, "id" | "name" | "photo_url"> | null;
  isUserPayout?: boolean;
};

export type CalendarData = {
  events: CalendarEvent[];
  cycles: (Cycle & { payout_user: Pick<User, "id" | "name" | "photo_url"> | null })[];
};

export async function getCalendarData(groupId: string): Promise<CalendarData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { events: [], cycles: [] };
  }

  // Get all cycles for the group with payout user details
  const { data: cycles } = await supabase
    .from("cycles")
    .select(
      `
      *,
      users:payout_user_id (
        id,
        name,
        photo_url
      )
    `
    )
    .eq("group_id", groupId)
    .order("cycle_number", { ascending: true });

  if (!cycles) {
    return { events: [], cycles: [] };
  }

  // Get the group for contribution amount and fee details
  const { data: group } = await supabase
    .from("groups")
    .select("contribution_amount, members_limit, organizer_fee_type, organizer_fee_value")
    .eq("id", groupId)
    .single();

  if (!group) {
    return { events: [], cycles: [] };
  }

  // Calculate net payout after organizer fee
  const payoutDetails = calculateNetPayout(
    group.contribution_amount,
    group.members_limit,
    group.organizer_fee_type,
    group.organizer_fee_value
  );

  const events: CalendarEvent[] = [];

  for (const cycle of cycles) {
    const payoutUser = cycle.users as Pick<User, "id" | "name" | "photo_url"> | null;

    // Add contribution due event
    events.push({
      id: `contrib-${cycle.id}`,
      date: cycle.due_date,
      type: "contribution_due",
      cycleNumber: cycle.cycle_number,
      amount: group.contribution_amount,
      status: cycle.status,
      payoutUser,
      isUserPayout: payoutUser?.id === user.id,
    });

    // Add payout event (same date as due date for simplicity)
    // Uses net payout (after organizer fee deduction)
    if (payoutUser) {
      events.push({
        id: `payout-${cycle.id}`,
        date: cycle.due_date,
        type: "payout",
        cycleNumber: cycle.cycle_number,
        amount: payoutDetails.netPayout,
        status: cycle.status,
        payoutUser,
        isUserPayout: payoutUser.id === user.id,
      });
    }
  }

  return {
    events,
    cycles: cycles.map((c) => ({
      ...c,
      payout_user: c.users as Pick<User, "id" | "name" | "photo_url"> | null,
    })),
  };
}
