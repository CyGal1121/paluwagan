import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  Check,
  X,
  Play,
  DollarSign,
  AlertCircle,
  Clock,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getInitials } from "@/lib/utils";
import type { AuditLog } from "@/types/database";

interface AuditPageProps {
  params: Promise<{ groupId: string }>;
}

const getActionIcon = (action: string, entityType: string) => {
  switch (action) {
    case "create":
      return <FileText className="h-4 w-4 text-primary" />;
    case "start":
      return <Play className="h-4 w-4 text-success" />;
    case "join":
    case "join_request":
    case "approve":
      return <UserPlus className="h-4 w-4 text-success" />;
    case "remove":
    case "freeze":
      return <UserMinus className="h-4 w-4 text-destructive" />;
    case "submit":
    case "confirm":
    case "confirm_received":
    case "mark_sent":
      return <Check className="h-4 w-4 text-success" />;
    case "dispute":
      return <X className="h-4 w-4 text-destructive" />;
    case "close":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActionDescription = (log: AuditLog & { users: { name: string | null } | null }) => {
  const actorName = log.users?.name || "Someone";

  switch (log.action) {
    case "create":
      if (log.entity_type === "group") return `${actorName} created the group`;
      if (log.entity_type === "invite") return `${actorName} created an invite link`;
      return `${actorName} created a ${log.entity_type}`;

    case "start":
      return `${actorName} started the group`;

    case "join":
      return `${actorName} joined the group`;

    case "join_request":
      return `${actorName} requested to join`;

    case "approve":
      return `${actorName} approved a member`;

    case "remove":
      return `${actorName} removed a member`;

    case "freeze":
      return `${actorName} froze a member`;

    case "submit":
      return `${actorName} submitted their contribution`;

    case "confirm":
      return `${actorName} confirmed a contribution`;

    case "dispute":
      if (log.entity_type === "contribution") return `${actorName} disputed a contribution`;
      if (log.entity_type === "payout") return `${actorName} disputed a payout`;
      return `${actorName} raised a dispute`;

    case "mark_sent":
      return `${actorName} marked payout as sent`;

    case "confirm_received":
      return `${actorName} confirmed receiving payout`;

    case "close":
      return `${actorName} closed a cycle`;

    default:
      return `${actorName} performed ${log.action} on ${log.entity_type}`;
  }
};

export default async function AuditPage({ params }: AuditPageProps) {
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
    .select("name")
    .eq("id", groupId)
    .single();

  if (!group) {
    notFound();
  }

  // Get user's membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.status === "removed") {
    notFound();
  }

  // Get audit logs
  const { data: logs } = await supabase
    .from("audit_logs")
    .select(
      `
      *,
      users:actor_user_id (
        name,
        photo_url
      )
    `
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(100);

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
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground text-sm">{group.name}</p>
        </div>
      </div>

      {/* Audit Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => {
                const actorUser = log.users as {
                  name: string | null;
                  photo_url: string | null;
                } | null;

                return (
                  <div key={log.id}>
                    <div className="flex items-start gap-3 py-3">
                      <Avatar className="h-8 w-8 mt-0.5">
                        <AvatarImage src={actorUser?.photo_url || ""} />
                        <AvatarFallback className="text-xs">
                          {getInitials(actorUser?.name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {getActionDescription(
                              log as AuditLog & { users: { name: string | null } | null }
                            )}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.entity_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                        {log.metadata_json &&
                          Object.keys(log.metadata_json as object).length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                              <pre className="whitespace-pre-wrap break-all">
                                {JSON.stringify(log.metadata_json, null, 2)}
                              </pre>
                            </div>
                          )}
                      </div>
                      <div className="p-2 rounded-full bg-muted">
                        {getActionIcon(log.action, log.entity_type)}
                      </div>
                    </div>
                    {index < logs.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
