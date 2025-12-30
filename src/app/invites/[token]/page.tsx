import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinGroupForm } from "@/components/join-group-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, DollarSign, Clock, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Get invite with group details
  const { data: invite } = await supabase
    .from("invites")
    .select(
      `
      id,
      token,
      expires_at,
      max_uses,
      use_count,
      groups (
        id,
        name,
        contribution_amount,
        frequency,
        start_date,
        members_limit,
        status,
        rules_json,
        organizer_user_id,
        users!groups_organizer_user_id_fkey (
          name
        )
      )
    `
    )
    .eq("token", token)
    .single();

  if (!invite || !invite.groups) {
    notFound();
  }

  const group = invite.groups as {
    id: string;
    name: string;
    contribution_amount: number;
    frequency: string;
    start_date: string;
    members_limit: number;
    status: string;
    rules_json: Record<string, unknown>;
    organizer_user_id: string;
    users: { name: string | null };
  };

  // Check if expired
  const isExpired = new Date(invite.expires_at) < new Date();
  const isMaxedOut = invite.max_uses && invite.use_count >= invite.max_uses;

  // Get current member count
  const { count: memberCount } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", group.id)
    .in("status", ["active", "pending"]);

  const isFull = memberCount ? memberCount >= group.members_limit : false;

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if already a member
  let existingMembership = null;
  if (user) {
    const { data } = await supabase
      .from("group_members")
      .select("status")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .single();
    existingMembership = data;
  }

  const canJoin = !isExpired && !isMaxedOut && !isFull && !existingMembership;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary">Pinoy Paluwagan</h1>
          <p className="text-muted-foreground">You&apos;ve been invited to join</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{group.name}</CardTitle>
            <CardDescription>Organized by {group.users?.name || "Unknown"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Group Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Contribution</p>
                  <p className="font-semibold">{formatCurrency(group.contribution_amount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Frequency</p>
                  <p className="font-semibold capitalize">{group.frequency}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Starts</p>
                  <p className="font-semibold">{formatDate(group.start_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Members</p>
                  <p className="font-semibold">
                    {memberCount}/{group.members_limit}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Payout */}
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Payout per Cycle</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(group.contribution_amount * group.members_limit)}
              </p>
            </div>

            {/* Status Messages */}
            {isExpired && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">This invite link has expired</span>
              </div>
            )}

            {isMaxedOut && !isExpired && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">This invite has reached its maximum uses</span>
              </div>
            )}

            {isFull && !isExpired && !isMaxedOut && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 text-warning rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">This group is full</span>
              </div>
            )}

            {existingMembership && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Badge variant={existingMembership.status === "active" ? "success" : "warning"}>
                  {existingMembership.status === "active"
                    ? "You're already a member"
                    : "Your request is pending"}
                </Badge>
              </div>
            )}

            {/* Join Form or Login Prompt */}
            <JoinGroupForm
              token={token}
              canJoin={canJoin}
              isAuthenticated={!!user}
              groupId={group.id}
              existingStatus={existingMembership?.status}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
