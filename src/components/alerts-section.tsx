import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, DollarSign, ChevronRight } from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { addDays, isBefore, isAfter } from "date-fns";

type Alert = {
  id: string;
  type: "due_soon" | "overdue" | "payout_upcoming";
  groupId: string;
  groupName: string;
  cycleId: string;
  cycleNumber: number;
  dueDate: string;
  amount: number;
};

export async function AlertsSection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date();
  const alerts: Alert[] = [];

  // Get user's active group memberships
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name, contribution_amount, frequency)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    return null;
  }

  const groupIds = memberships.map((m) => m.group_id);

  // Get open cycles for user's groups
  const { data: cycles } = await supabase
    .from("cycles")
    .select("id, group_id, cycle_number, due_date, payout_user_id")
    .in("group_id", groupIds)
    .eq("status", "open");

  if (!cycles || cycles.length === 0) {
    return null;
  }

  // Get user's contributions for these cycles
  const cycleIds = cycles.map((c) => c.id);
  const { data: contributions } = await supabase
    .from("contributions")
    .select("id, cycle_id, status")
    .in("cycle_id", cycleIds)
    .eq("user_id", user.id);

  const contributionMap = new Map(contributions?.map((c) => [c.cycle_id, c]) || []);

  // Process each cycle for alerts
  for (const cycle of cycles) {
    const membership = memberships.find((m) => m.group_id === cycle.group_id);
    if (!membership || !membership.groups) continue;

    const group = membership.groups as {
      id: string;
      name: string;
      contribution_amount: number;
      frequency: string;
    };

    const dueDate = new Date(cycle.due_date);
    const contribution = contributionMap.get(cycle.id);
    const isPaid = contribution?.status === "paid_confirmed";

    // Calculate reminder threshold based on frequency
    const reminderDays = group.frequency === "weekly" ? 1 : 3;
    const reminderDate = addDays(dueDate, -reminderDays);

    if (!isPaid) {
      if (isBefore(dueDate, today)) {
        // Overdue
        alerts.push({
          id: `overdue-${cycle.id}`,
          type: "overdue",
          groupId: group.id,
          groupName: group.name,
          cycleId: cycle.id,
          cycleNumber: cycle.cycle_number,
          dueDate: cycle.due_date,
          amount: group.contribution_amount,
        });
      } else if (isBefore(reminderDate, today) && isBefore(today, dueDate)) {
        // Due soon
        alerts.push({
          id: `due-${cycle.id}`,
          type: "due_soon",
          groupId: group.id,
          groupName: group.name,
          cycleId: cycle.id,
          cycleNumber: cycle.cycle_number,
          dueDate: cycle.due_date,
          amount: group.contribution_amount,
        });
      }
    }

    // Check if user is the payout recipient for this cycle
    if (cycle.payout_user_id === user.id) {
      alerts.push({
        id: `payout-${cycle.id}`,
        type: "payout_upcoming",
        groupId: group.id,
        groupName: group.name,
        cycleId: cycle.id,
        cycleNumber: cycle.cycle_number,
        dueDate: cycle.due_date,
        amount: group.contribution_amount * (memberships.length || 1),
      });
    }
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-warning" />
        Alerts
      </h2>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <Link key={alert.id} href={`/groups/${alert.groupId}`}>
            <Card
              className={`hover:bg-muted/50 transition-colors cursor-pointer ${
                alert.type === "overdue" ? "border-destructive/50" : ""
              }`}
            >
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  {alert.type === "overdue" && (
                    <div className="p-2 rounded-full bg-destructive/10">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                  )}
                  {alert.type === "due_soon" && (
                    <div className="p-2 rounded-full bg-warning/10">
                      <Clock className="h-4 w-4 text-warning" />
                    </div>
                  )}
                  {alert.type === "payout_upcoming" && (
                    <div className="p-2 rounded-full bg-success/10">
                      <DollarSign className="h-4 w-4 text-success" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {alert.type === "overdue" && "Payment Overdue"}
                      {alert.type === "due_soon" && "Payment Due Soon"}
                      {alert.type === "payout_upcoming" && "Payout Coming"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.groupName} • Cycle {alert.cycleNumber} •{" "}
                      {formatDateShort(alert.dueDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      alert.type === "overdue"
                        ? "destructive"
                        : alert.type === "payout_upcoming"
                          ? "success"
                          : "warning"
                    }
                  >
                    {formatCurrency(alert.amount)}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
