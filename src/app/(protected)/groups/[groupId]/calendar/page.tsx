import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCalendarData } from "@/lib/actions/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar } from "lucide-react";
import { CalendarView } from "@/components/calendar";

interface CalendarPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Verify user is member of this group
  const { data: membership } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.status === "removed") {
    notFound();
  }

  // Get group info
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, status, frequency, start_date, contribution_amount, members_limit")
    .eq("id", groupId)
    .single();

  if (!group) {
    notFound();
  }

  // Get calendar data
  const calendarData = await getCalendarData(groupId);

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
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground text-sm">{group.name}</p>
        </div>
      </div>

      {/* Info Banner for forming groups */}
      {group.status === "forming" && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium">Branch is still forming</p>
              <p className="text-sm text-muted-foreground">
                The payout schedule will be generated once the branch starts.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payout Schedule</CardTitle>
          <CardDescription>
            View all cycles and payout dates for this branch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarView events={calendarData.events} />
        </CardContent>
      </Card>
    </div>
  );
}
