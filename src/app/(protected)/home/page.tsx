import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { AlertsSection } from "@/components/alerts-section";

async function GroupsList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's groups with member count and current cycle
  const { data: memberships } = await supabase
    .from("group_members")
    .select(
      `
      role,
      status,
      groups (
        id,
        name,
        contribution_amount,
        frequency,
        status,
        members_limit
      )
    `
    )
    .eq("user_id", user.id)
    .in("status", ["active", "pending"]);

  if (!memberships || memberships.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No groups yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create a new group or join one using an invite link
          </p>
          <Button asChild>
            <Link href="/groups/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Group
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {memberships.map((membership) => {
        const group = membership.groups as {
          id: string;
          name: string;
          contribution_amount: number;
          frequency: string;
          status: string;
          members_limit: number;
        };

        return (
          <Link key={group.id} href={`/groups/${group.id}`}>
            <Card className="hover:bg-muted/50 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="flex items-center justify-between p-4 md:p-5">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{group.name}</h3>
                    {membership.role === "organizer" && (
                      <Badge variant="secondary" className="text-xs">
                        Organizer
                      </Badge>
                    )}
                    {membership.status === "pending" && (
                      <Badge variant="warning" className="text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(group.contribution_amount)} / {group.frequency}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function GroupsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="flex items-center justify-between p-4 md:p-5">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-5 w-5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function HomePage() {
  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Groups</h1>
          <p className="text-muted-foreground text-sm">Manage your paluwagan groups</p>
        </div>
        <Button asChild size="sm">
          <Link href="/groups/new">
            <Plus className="mr-2 h-4 w-4" />
            New Group
          </Link>
        </Button>
      </div>

      <Suspense fallback={<AlertsSkeleton />}>
        <AlertsSection />
      </Suspense>

      <section>
        <h2 className="text-lg font-semibold mb-3">Your Groups</h2>
        <Suspense fallback={<GroupsListSkeleton />}>
          <GroupsList />
        </Suspense>
      </section>
    </div>
  );
}

function AlertsSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}
