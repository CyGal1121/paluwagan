import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, CheckCircle, Clock, User } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import type { Cycle } from "@/types/database";

interface CyclesPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function CyclesPage({ params }: CyclesPageProps) {
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
    .select("name, status, frequency, contribution_amount, members_limit")
    .eq("id", groupId)
    .single<{
      name: string;
      status: string;
      frequency: string;
      contribution_amount: number;
      members_limit: number;
    }>();

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

  // Get all cycles with payout user
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
    .order("cycle_number", { ascending: true })
    .returns<
      Array<
        Cycle & {
          users: { id: string; name: string | null; photo_url: string | null } | null;
        }
      >
    >();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="default">Current</Badge>;
      case "closed":
        return <Badge variant="success">Completed</Badge>;
      case "closing":
        return <Badge variant="warning">Closing</Badge>;
      default:
        return <Badge variant="secondary">Upcoming</Badge>;
    }
  };

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
          <h1 className="text-2xl font-bold">Cycles</h1>
          <p className="text-muted-foreground text-sm">{group.name}</p>
        </div>
      </div>

      {/* Cycles List */}
      {!cycles || cycles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No cycles have been generated yet.</p>
            <p className="text-sm">Start the group to generate cycles.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cycles.map((cycle) => {
            const payoutUser = cycle.users as {
              id: string;
              name: string | null;
              photo_url: string | null;
            } | null;
            const isUserRecipient = payoutUser?.id === user.id;

            return (
              <Link key={cycle.id} href={`/groups/${groupId}/ledger?cycle=${cycle.cycle_number}`}>
                <Card
                  className={`hover:bg-muted/50 transition-colors cursor-pointer ${
                    cycle.status === "open" ? "border-primary" : ""
                  } ${isUserRecipient ? "bg-success/5" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                            cycle.status === "closed"
                              ? "bg-success/10 text-success"
                              : cycle.status === "open"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {cycle.cycle_number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Cycle {cycle.cycle_number}</p>
                            {getStatusBadge(cycle.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Due: {formatDate(cycle.due_date)}
                          </p>
                        </div>
                      </div>

                      {/* Payout Recipient */}
                      {payoutUser ? (
                        <div className="flex items-center gap-2">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-muted-foreground">Recipient</p>
                            <p className="text-sm font-medium">
                              {isUserRecipient ? "You" : payoutUser.name}
                            </p>
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={payoutUser.photo_url || ""} />
                            <AvatarFallback className="text-xs">
                              {getInitials(payoutUser.name || "?")}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span className="text-sm">TBD</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {cycles && cycles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Cycles</p>
                <p className="font-semibold">{cycles.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Completed</p>
                <p className="font-semibold">
                  {cycles.filter((c) => c.status === "closed").length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Per Cycle</p>
                <p className="font-semibold">{formatCurrency(group.contribution_amount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Pool</p>
                <p className="font-semibold text-primary">
                  {formatCurrency(group.contribution_amount * group.members_limit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
