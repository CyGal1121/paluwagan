"use server";

import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

interface ExportContribution {
  cycleNumber: number;
  memberName: string;
  amount: number;
  status: string;
  isLate: boolean;
  date: string;
}

interface ExportPayout {
  cycleNumber: number;
  recipientName: string;
  amount: number;
  status: string;
  sentAt: string | null;
  confirmedAt: string | null;
}

interface LedgerExportData {
  groupName: string;
  exportDate: string;
  contributions: ExportContribution[];
  payouts: ExportPayout[];
  summary: {
    totalContributions: number;
    totalPayouts: number;
    confirmedContributions: number;
    pendingContributions: number;
  };
}

// Get ledger data for export
export async function getLedgerExportData(
  groupId: string
): Promise<{ success: boolean; data?: LedgerExportData; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.status !== "active") {
    return { success: false, error: "Not authorized" };
  }

  // Get group info
  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  if (!group) {
    return { success: false, error: "Group not found" };
  }

  // Get all cycles with contributions
  const { data: cycles } = await supabase
    .from("cycles")
    .select(`
      cycle_number,
      contributions (
        amount,
        status,
        is_late,
        created_at,
        users:user_id (name)
      ),
      payouts (
        amount,
        status,
        sent_at,
        confirmed_at,
        users:recipient_user_id (name)
      )
    `)
    .eq("group_id", groupId)
    .order("cycle_number", { ascending: true });

  if (!cycles) {
    return { success: false, error: "No data found" };
  }

  // Transform data
  const contributions: ExportContribution[] = [];
  const payouts: ExportPayout[] = [];
  let totalContributions = 0;
  let totalPayouts = 0;
  let confirmedContributions = 0;
  let pendingContributions = 0;

  for (const cycle of cycles) {
    // Process contributions
    for (const contrib of (cycle.contributions || []) as Array<{
      amount: number;
      status: string;
      is_late: boolean;
      created_at: string;
      users: { name: string | null } | null;
    }>) {
      contributions.push({
        cycleNumber: cycle.cycle_number,
        memberName: contrib.users?.name || "Unknown",
        amount: contrib.amount,
        status: contrib.status,
        isLate: contrib.is_late,
        date: new Date(contrib.created_at).toLocaleDateString(),
      });

      totalContributions += contrib.amount;
      if (contrib.status === "paid_confirmed") {
        confirmedContributions += contrib.amount;
      } else if (contrib.status === "pending_proof") {
        pendingContributions += contrib.amount;
      }
    }

    // Process payouts
    for (const payout of (cycle.payouts || []) as Array<{
      amount: number;
      status: string;
      sent_at: string | null;
      confirmed_at: string | null;
      users: { name: string | null } | null;
    }>) {
      payouts.push({
        cycleNumber: cycle.cycle_number,
        recipientName: payout.users?.name || "Unknown",
        amount: payout.amount,
        status: payout.status,
        sentAt: payout.sent_at
          ? new Date(payout.sent_at).toLocaleDateString()
          : null,
        confirmedAt: payout.confirmed_at
          ? new Date(payout.confirmed_at).toLocaleDateString()
          : null,
      });

      if (payout.status === "confirmed_by_recipient") {
        totalPayouts += payout.amount;
      }
    }
  }

  return {
    success: true,
    data: {
      groupName: group.name,
      exportDate: new Date().toLocaleDateString(),
      contributions,
      payouts,
      summary: {
        totalContributions,
        totalPayouts,
        confirmedContributions,
        pendingContributions,
      },
    },
  };
}

// Generate CSV content
export async function generateCSV(
  groupId: string
): Promise<{ success: boolean; csv?: string; filename?: string; error?: string }> {
  const result = await getLedgerExportData(groupId);

  if (!result.success || !result.data) {
    return { success: false, error: result.error };
  }

  const { groupName, exportDate, contributions, payouts, summary } = result.data;

  const lines: string[] = [];

  // Header
  lines.push(`"${groupName} - Ledger Export"`);
  lines.push(`"Generated: ${exportDate}"`);
  lines.push("");

  // Summary
  lines.push('"SUMMARY"');
  lines.push(`"Total Contributions","${formatCurrency(summary.totalContributions)}"`);
  lines.push(`"Confirmed Contributions","${formatCurrency(summary.confirmedContributions)}"`);
  lines.push(`"Pending Contributions","${formatCurrency(summary.pendingContributions)}"`);
  lines.push(`"Total Payouts","${formatCurrency(summary.totalPayouts)}"`);
  lines.push("");

  // Contributions
  lines.push('"CONTRIBUTIONS"');
  lines.push('"Cycle","Member","Amount","Status","Late","Date"');
  for (const c of contributions) {
    lines.push(
      `${c.cycleNumber},"${c.memberName}","${formatCurrency(c.amount)}","${c.status}","${c.isLate ? "Yes" : "No"}","${c.date}"`
    );
  }
  lines.push("");

  // Payouts
  lines.push('"PAYOUTS"');
  lines.push('"Cycle","Recipient","Amount","Status","Sent","Confirmed"');
  for (const p of payouts) {
    lines.push(
      `${p.cycleNumber},"${p.recipientName}","${formatCurrency(p.amount)}","${p.status}","${p.sentAt || "N/A"}","${p.confirmedAt || "N/A"}"`
    );
  }

  const csv = lines.join("\n");
  const filename = `${groupName.replace(/[^a-z0-9]/gi, "_")}_ledger_${Date.now()}.csv`;

  return { success: true, csv, filename };
}

// Generate member report
export async function generateMemberReport(
  groupId: string
): Promise<{ success: boolean; csv?: string; filename?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get group with members
  const { data: group } = await supabase
    .from("groups")
    .select(`
      name,
      contribution_amount,
      frequency,
      group_members (
        role,
        status,
        payout_position,
        joined_at,
        users:user_id (name, email, phone)
      )
    `)
    .eq("id", groupId)
    .single();

  if (!group) {
    return { success: false, error: "Group not found" };
  }

  const lines: string[] = [];

  // Header
  lines.push(`"${group.name} - Member Report"`);
  lines.push(`"Generated: ${new Date().toLocaleDateString()}"`);
  lines.push(`"Contribution: ${formatCurrency(group.contribution_amount)} (${group.frequency})"`);
  lines.push("");

  // Members
  lines.push('"MEMBERS"');
  lines.push('"Name","Email","Phone","Role","Status","Payout Position","Joined"');

  for (const member of (group.group_members || []) as Array<{
    role: string;
    status: string;
    payout_position: number | null;
    joined_at: string;
    users: { name: string | null; email: string | null; phone: string | null } | null;
  }>) {
    lines.push(
      `"${member.users?.name || "Unknown"}","${member.users?.email || "N/A"}","${member.users?.phone || "N/A"}","${member.role}","${member.status}","${member.payout_position || "N/A"}","${new Date(member.joined_at).toLocaleDateString()}"`
    );
  }

  const csv = lines.join("\n");
  const filename = `${group.name.replace(/[^a-z0-9]/gi, "_")}_members_${Date.now()}.csv`;

  return { success: true, csv, filename };
}
