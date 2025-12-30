import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Eye, XCircle } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { LedgerActions } from "@/components/ledger-actions";

interface LedgerPageProps {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ cycle?: string }>;
}

export default async function LedgerPage({ params, searchParams }: LedgerPageProps) {
  const { groupId } = await params;
  const { cycle: cycleParam } = await searchParams;
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
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) {
    notFound();
  }

  // Get user's membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.status === "removed") {
    notFound();
  }

  const isOrganizer = membership.role === "organizer";

  // Get all cycles
  const { data: cycles } = await supabase
    .from("cycles")
    .select("*")
    .eq("group_id", groupId)
    .order("cycle_number", { ascending: true });

  if (!cycles || cycles.length === 0) {
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/groups/${groupId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Ledger</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No cycles have been generated yet. Start the group to begin.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine which cycle to show
  const selectedCycleNumber = cycleParam ? parseInt(cycleParam) :
    cycles.find(c => c.status === "open")?.cycle_number || cycles[0].cycle_number;

  const selectedCycle = cycles.find((c) => c.cycle_number === selectedCycleNumber) || cycles[0];

  // Get contributions for selected cycle with user info
  const { data: contributions } = await supabase
    .from("contributions")
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
    .eq("cycle_id", selectedCycle.id)
    .order("created_at", { ascending: true });

  // Get payout for selected cycle
  const { data: payout } = await supabase
    .from("payouts")
    .select(
      `
      *,
      users:recipient_user_id (
        id,
        name,
        photo_url
      )
    `
    )
    .eq("cycle_id", selectedCycle.id)
    .single();

  // Calculate stats
  const stats = {
    total: contributions?.length || 0,
    paid: contributions?.filter((c) => c.status === "paid_confirmed").length || 0,
    pending: contributions?.filter((c) => c.status === "pending_proof").length || 0,
    unpaid: contributions?.filter((c) => c.status === "unpaid").length || 0,
    disputed: contributions?.filter((c) => c.status === "disputed").length || 0,
    late: contributions?.filter((c) => c.is_late).length || 0,
  };

  const totalExpected = group.contribution_amount * stats.total;
  const totalConfirmed = group.contribution_amount * stats.paid;

  const getStatusIcon = (status: string, isLate: boolean) => {
    switch (status) {
      case "paid_confirmed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "pending_proof":
        return <Clock className="h-4 w-4 text-warning" />;
      case "disputed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return isLate ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Clock className="h-4 w-4 text-muted-foreground" />
        );
    }
  };

  const getStatusBadge = (status: string, isLate: boolean) => {
    switch (status) {
      case "paid_confirmed":
        return <Badge variant="success">Paid</Badge>;
      case "pending_proof":
        return <Badge variant="warning">Pending</Badge>;
      case "disputed":
        return <Badge variant="destructive">Disputed</Badge>;
      default:
        return isLate ? (
          <Badge variant="destructive">Late</Badge>
        ) : (
          <Badge variant="secondary">Unpaid</Badge>
        );
    }
  };

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/groups/${groupId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Ledger</h1>
            <p className="text-muted-foreground text-sm">{group.name}</p>
          </div>
        </div>

        {/* Cycle Selector */}
        <Select
          defaultValue={selectedCycleNumber.toString()}
          onValueChange={(value) => {
            window.location.href = `/groups/${groupId}/ledger?cycle=${value}`;
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cycles.map((c) => (
              <SelectItem key={c.id} value={c.cycle_number.toString()}>
                Cycle {c.cycle_number}
                {c.status === "open" && " (Current)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cycle Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cycle {selectedCycle.cycle_number}</CardTitle>
              <CardDescription>Due: {formatDate(selectedCycle.due_date)}</CardDescription>
            </div>
            <Badge
              variant={
                selectedCycle.status === "open"
                  ? "default"
                  : selectedCycle.status === "closed"
                    ? "secondary"
                    : "outline"
              }
            >
              {selectedCycle.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Expected</p>
              <p className="text-lg font-semibold">{formatCurrency(totalExpected)}</p>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Confirmed</p>
              <p className="text-lg font-semibold text-success">
                {formatCurrency(totalConfirmed)}
              </p>
            </div>
          </div>

          {/* Status Summary */}
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>{stats.paid} paid</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-warning" />
              <span>{stats.pending} pending</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span>{stats.unpaid} unpaid</span>
            </div>
            {stats.late > 0 && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{stats.late} late</span>
              </div>
            )}
          </div>

          {/* Payout Recipient */}
          {payout && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={(payout.users as { photo_url?: string })?.photo_url || ""}
                    />
                    <AvatarFallback>
                      {getInitials((payout.users as { name?: string })?.name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">Payout Recipient</p>
                    <p className="font-medium">
                      {(payout.users as { name?: string })?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">
                    {formatCurrency(payout.amount)}
                  </p>
                  <Badge
                    variant={
                      payout.status === "confirmed_by_recipient"
                        ? "success"
                        : payout.status === "sent_by_organizer"
                          ? "warning"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {payout.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contributions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contributions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {isOrganizer && <TableHead className="w-16"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions?.map((contribution) => {
                const memberUser = contribution.users as {
                  id: string;
                  name: string | null;
                  photo_url: string | null;
                };
                return (
                  <TableRow key={contribution.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={memberUser?.photo_url || ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(memberUser?.name || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{memberUser?.name}</p>
                          {contribution.is_late && contribution.status !== "paid_confirmed" && (
                            <p className="text-xs text-destructive">Late</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(contribution.status, contribution.is_late)}
                        {getStatusBadge(contribution.status, contribution.is_late)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(contribution.amount)}
                    </TableCell>
                    {isOrganizer && (
                      <TableCell>
                        <LedgerActions
                          contribution={contribution}
                          groupId={groupId}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
