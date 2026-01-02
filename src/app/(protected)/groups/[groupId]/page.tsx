import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Users,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { InviteDialog } from "@/components/invite-dialog";
import { ContributionCard } from "@/components/contribution-card";
import { StartGroupButton } from "@/components/start-group-button";
import type { Group, GroupMember, Cycle, Contribution, User } from "@/types/database";
import { calculateNetPayout } from "@/types/database";

// Type definitions for joined queries
type GroupWithOrganizer = Group & {
  users: Pick<User, "id" | "name" | "photo_url"> | null;
};

type GroupMemberWithUser = GroupMember & {
  users: Pick<User, "id" | "name" | "photo_url"> | null;
};

type CycleWithPayoutUser = Cycle & {
  users: Pick<User, "id" | "name" | "photo_url"> | null;
};

interface GroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Get group with organizer details
  const { data: groupData } = await supabase
    .from("groups")
    .select(
      `
      *,
      users!groups_organizer_user_id_fkey (
        id,
        name,
        photo_url
      )
    `
    )
    .eq("id", groupId)
    .single();

  if (!groupData) {
    notFound();
  }

  const group = groupData as unknown as GroupWithOrganizer;

  // Get current user's membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.status === "removed") {
    notFound();
  }

  const isOrganizer = membership.role === "organizer";
  const isPending = membership.status === "pending";

  // Get all active members
  const { data: membersData } = await supabase
    .from("group_members")
    .select(
      `
      *,
      users (
        id,
        name,
        photo_url
      )
    `
    )
    .eq("group_id", groupId)
    .in("status", ["active", "pending"])
    .order("payout_position", { ascending: true });

  const members = (membersData || []) as unknown as GroupMemberWithUser[];

  // Get current/upcoming cycle
  const { data: cycleData } = await supabase
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
    .in("status", ["open", "upcoming"])
    .order("cycle_number", { ascending: true })
    .limit(1)
    .single();

  const currentCycle = cycleData as unknown as CycleWithPayoutUser | null;

  // Get user's contribution for current cycle
  let userContribution: Contribution | null = null;
  if (currentCycle) {
    const { data } = await supabase
      .from("contributions")
      .select("*")
      .eq("cycle_id", currentCycle.id)
      .eq("user_id", user.id)
      .single();
    userContribution = data;
  }

  // Get cycle stats
  let cycleStats = { paid: 0, pending: 0, total: 0 };
  if (currentCycle) {
    const { data: contributions } = await supabase
      .from("contributions")
      .select("status")
      .eq("cycle_id", currentCycle.id);

    if (contributions) {
      cycleStats.total = contributions.length;
      cycleStats.paid = contributions.filter((c) => c.status === "paid_confirmed").length;
      cycleStats.pending = contributions.filter(
        (c) => c.status === "pending_proof" || c.status === "unpaid"
      ).length;
    }
  }

  const organizer = group.users;
  const activeMembers = members.filter((m) => m.status === "active");
  const pendingMembers = members.filter((m) => m.status === "pending");

  // Calculate net payout after organizer fee
  const payoutDetails = calculateNetPayout(
    group.contribution_amount,
    group.members_limit,
    group.organizer_fee_type,
    group.organizer_fee_value
  );

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/home">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold">{group.name}</h1>
              <Badge
                variant={
                  group.status === "active"
                    ? "success"
                    : group.status === "forming"
                      ? "warning"
                      : "secondary"
                }
              >
                {group.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Organized by {organizer?.name || "Unknown"}
            </p>
          </div>
        </div>
        {isOrganizer && (
          <InviteDialog groupId={groupId} groupName={group.name} />
        )}
      </div>

      {/* Pending Status Warning */}
      {isPending && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium">Membership Pending</p>
              <p className="text-sm text-muted-foreground">
                Your request to join is awaiting approval from the organizer.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Contribution</p>
            <p className="font-semibold">{formatCurrency(group.contribution_amount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Frequency</p>
            <p className="font-semibold capitalize">{group.frequency}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Members</p>
            <p className="font-semibold">
              {activeMembers.length}/{group.members_limit}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-success mb-1" />
            <p className="text-xs text-muted-foreground">Net Payout</p>
            <p className="font-semibold text-success">
              {formatCurrency(payoutDetails.netPayout)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {group.organizer_fee_type === "percentage"
                ? `${group.organizer_fee_value}% fee`
                : `₱${group.organizer_fee_value} fee`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Group Status - Forming */}
      {group.status === "forming" && isOrganizer && (
        <Card className="border-primary/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Forming Group</p>
                <p className="text-sm text-muted-foreground">
                  {activeMembers.length} of {group.members_limit} members joined
                  {pendingMembers.length > 0 && ` (${pendingMembers.length} pending approval)`}
                </p>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${(activeMembers.length / group.members_limit) * 100}%`,
                }}
              />
            </div>
            {activeMembers.length >= 2 && (
              <StartGroupButton groupId={groupId} memberCount={activeMembers.length} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Cycle */}
      {currentCycle && !isPending && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Cycle {currentCycle.cycle_number}</CardTitle>
              <Badge variant={currentCycle.status === "open" ? "default" : "secondary"}>
                {currentCycle.status}
              </Badge>
            </div>
            <CardDescription>
              Due: {formatDate(currentCycle.due_date)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payout Recipient */}
            {currentCycle.users && (() => {
              // Calculate actual payout based on current active members
              const actualPayout = calculateNetPayout(
                group.contribution_amount,
                activeMembers.length,
                group.organizer_fee_type,
                group.organizer_fee_value
              );
              return (
                <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentCycle.users.photo_url || ""} />
                      <AvatarFallback>
                        {getInitials(currentCycle.users.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Payout Recipient</p>
                      <p className="font-medium">
                        {currentCycle.users.name}
                        {currentCycle.users.id === user.id && " (You)"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success">
                      {formatCurrency(actualPayout.netPayout)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      after {group.organizer_fee_type === "percentage"
                        ? `${group.organizer_fee_value}%`
                        : formatCurrency(group.organizer_fee_value)} fee
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Cycle Progress */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>{cycleStats.paid} paid</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <span>{cycleStats.pending} pending</span>
              </div>
            </div>

            {/* User's Contribution Status */}
            <ContributionCard
              contribution={userContribution}
              cycleId={currentCycle.id}
              groupId={groupId}
              amount={group.contribution_amount}
              dueDate={currentCycle.due_date}
              isOrganizer={isOrganizer}
            />
          </CardContent>
        </Card>
      )}

    </div>
  );
}
