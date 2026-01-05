import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Crown, User } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { MemberActions } from "@/components/member-actions";
import type { GroupMember } from "@/types/database";

interface MembersPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Get group
  const { data: group } = await supabase
    .from("groups")
    .select("name, status, members_limit")
    .eq("id", groupId)
    .single<{ name: string; status: string; members_limit: number }>();

  if (!group) {
    notFound();
  }

  // Get user's membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single<{ role: string; status: string }>();

  if (!membership || membership.status === "removed") {
    notFound();
  }

  const isOrganizer = membership.role === "organizer";

  // Get all members
  const { data: members } = await supabase
    .from("group_members")
    .select(
      `
      *,
      users (
        id,
        name,
        photo_url,
        email
      )
    `
    )
    .eq("group_id", groupId)
    .neq("status", "removed")
    .order("payout_position", { ascending: true, nullsFirst: false })
    .order("joined_at", { ascending: true })
    .returns<
      Array<
        GroupMember & {
          users: { id: string; name: string | null; photo_url: string | null; email: string | null } | null;
        }
      >
    >();

  const activeMembers = members?.filter((m) => m.status === "active") || [];
  const pendingMembers = members?.filter((m) => m.status === "pending") || [];
  const frozenMembers = members?.filter((m) => m.status === "frozen") || [];

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/groups/${groupId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground text-sm">
            {activeMembers.length} of {group.members_limit} members
          </p>
        </div>
      </div>

      {/* Pending Members */}
      {pendingMembers.length > 0 && isOrganizer && (
        <Card className="border-warning/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="warning">{pendingMembers.length}</Badge>
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingMembers.map((member) => {
              const memberUser = member.users as {
                id: string;
                name: string | null;
                photo_url: string | null;
                email: string | null;
              };
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={memberUser?.photo_url || ""} />
                      <AvatarFallback>
                        {getInitials(memberUser?.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{memberUser?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {memberUser?.email}
                      </p>
                    </div>
                  </div>
                  <MemberActions
                    groupId={groupId}
                    userId={member.user_id}
                    status={member.status}
                    isOrganizer={isOrganizer}
                    isPendingApproval
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Active Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Active Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {activeMembers.map((member, index) => {
            const memberUser = member.users as {
              id: string;
              name: string | null;
              photo_url: string | null;
              email: string | null;
            };
            const isCurrentUser = member.user_id === user.id;

            return (
              <div key={member.id}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={memberUser?.photo_url || ""} />
                        <AvatarFallback>
                          {getInitials(memberUser?.name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      {member.role === "organizer" && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Crown className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {memberUser?.name || "Unknown"}
                          {isCurrentUser && " (You)"}
                        </p>
                        {member.role === "organizer" && (
                          <Badge variant="secondary" className="text-xs">
                            Organizer
                          </Badge>
                        )}
                      </div>
                      {member.payout_position && (
                        <p className="text-xs text-muted-foreground">
                          Payout position: #{member.payout_position}
                        </p>
                      )}
                    </div>
                  </div>
                  {isOrganizer && !isCurrentUser && member.role !== "organizer" && (
                    <MemberActions
                      groupId={groupId}
                      userId={member.user_id}
                      status={member.status}
                      isOrganizer={isOrganizer}
                    />
                  )}
                </div>
                {index < activeMembers.length - 1 && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Frozen Members */}
      {frozenMembers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-muted-foreground">
              Frozen Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {frozenMembers.map((member) => {
              const memberUser = member.users as {
                id: string;
                name: string | null;
                photo_url: string | null;
              };
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg opacity-75"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={memberUser?.photo_url || ""} />
                      <AvatarFallback>
                        {getInitials(memberUser?.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{memberUser?.name || "Unknown"}</p>
                      <Badge variant="secondary" className="text-xs">
                        Frozen
                      </Badge>
                    </div>
                  </div>
                  {isOrganizer && (
                    <MemberActions
                      groupId={groupId}
                      userId={member.user_id}
                      status={member.status}
                      isOrganizer={isOrganizer}
                    />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
