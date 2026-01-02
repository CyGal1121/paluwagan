"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BranchFee } from "@/types/database";
import { BRANCH_FEES } from "@/types/database";

export type FeeWithBranch = BranchFee & {
  groups: {
    id: string;
    name: string;
  };
};

export type FeeSummary = {
  totalUnpaid: number;
  totalPaid: number;
  setupFees: BranchFee[];
  monthlyFees: BranchFee[];
};

/**
 * Get all fees for a specific branch
 */
export async function getBranchFees(branchId: string): Promise<BranchFee[]> {
  const supabase = await createClient();

  const { data: fees } = await supabase
    .from("branch_fees")
    .select("*")
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false });

  return fees || [];
}

/**
 * Get fee summary for a branch
 */
export async function getFeeSummary(branchId: string): Promise<FeeSummary> {
  const fees = await getBranchFees(branchId);

  const setupFees = fees.filter((f) => f.fee_type === "setup");
  const monthlyFees = fees.filter((f) => f.fee_type === "monthly");

  const totalUnpaid = fees
    .filter((f) => f.status === "unpaid")
    .reduce((sum, f) => sum + f.amount, 0);

  const totalPaid = fees
    .filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + f.amount, 0);

  return {
    totalUnpaid,
    totalPaid,
    setupFees,
    monthlyFees,
  };
}

/**
 * Mark a fee as paid
 */
export async function markFeePaid(
  feeId: string,
  branchId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is organizer of this branch
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", branchId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "organizer") {
    return { success: false, error: "Only organizers can mark fees as paid" };
  }

  const { error } = await supabase
    .from("branch_fees")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paid_by: user.id,
    })
    .eq("id", feeId)
    .eq("branch_id", branchId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/groups/${branchId}/fees`);
  return { success: true };
}

/**
 * Waive a fee (organizer only)
 */
export async function waiveFee(
  feeId: string,
  branchId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is organizer of this branch
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", branchId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "organizer") {
    return { success: false, error: "Only organizers can waive fees" };
  }

  const { error } = await supabase
    .from("branch_fees")
    .update({
      status: "waived",
      notes: reason,
    })
    .eq("id", feeId)
    .eq("branch_id", branchId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/groups/${branchId}/fees`);
  return { success: true };
}

/**
 * Create monthly fee for a branch (should be called by a cron job or manual trigger)
 */
export async function createMonthlyFee(
  branchId: string
): Promise<{ success: boolean; error?: string; fee?: BranchFee }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if branch exists and is active
  const { data: branch } = await supabase
    .from("groups")
    .select("id, status")
    .eq("id", branchId)
    .single();

  if (!branch) {
    return { success: false, error: "Branch not found" };
  }

  if (branch.status !== "active") {
    return { success: false, error: "Branch is not active" };
  }

  // Check if monthly fee already exists for this month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data: existingFee } = await supabase
    .from("branch_fees")
    .select("id")
    .eq("branch_id", branchId)
    .eq("fee_type", "monthly")
    .gte("period_start", firstOfMonth.toISOString().split("T")[0])
    .lte("period_start", lastOfMonth.toISOString().split("T")[0])
    .single();

  if (existingFee) {
    return { success: false, error: "Monthly fee already exists for this month" };
  }

  // Create the monthly fee
  const { data: fee, error } = await supabase
    .from("branch_fees")
    .insert({
      branch_id: branchId,
      fee_type: "monthly",
      amount: BRANCH_FEES.MONTHLY,
      due_date: lastOfMonth.toISOString().split("T")[0],
      period_start: firstOfMonth.toISOString().split("T")[0],
      period_end: lastOfMonth.toISOString().split("T")[0],
      status: "unpaid",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/groups/${branchId}/fees`);
  return { success: true, fee };
}

/**
 * Get all unpaid fees for organizer's branches
 */
export async function getOrganizerUnpaidFees(): Promise<FeeWithBranch[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get all branches where user is organizer
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id)
    .eq("role", "organizer")
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    return [];
  }

  const branchIds = memberships.map((m) => m.group_id);

  // Get all unpaid fees for these branches
  const { data: fees } = await supabase
    .from("branch_fees")
    .select(
      `
      *,
      groups (
        id,
        name
      )
    `
    )
    .in("branch_id", branchIds)
    .eq("status", "unpaid")
    .order("due_date", { ascending: true });

  return (fees as unknown as FeeWithBranch[]) || [];
}
