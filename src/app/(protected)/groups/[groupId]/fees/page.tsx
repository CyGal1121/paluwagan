import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getFeeSummary } from "@/lib/actions/fee";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Receipt, Info } from "lucide-react";
import { FeeSummaryCard, FeeTracker } from "@/components/fees";
import { BRANCH_FEES } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface FeesPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function FeesPage({ params }: FeesPageProps) {
  const { groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Verify user is organizer of this branch
  const { data: membership } = await supabase
    .from("group_members")
    .select("role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.status === "removed") {
    notFound();
  }

  // Only organizers can view fees
  if (membership.role !== "organizer") {
    redirect(`/groups/${groupId}`);
  }

  // Get group info
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, status")
    .eq("id", groupId)
    .single();

  if (!group) {
    notFound();
  }

  // Get fee summary
  const feeSummary = await getFeeSummary(groupId);
  const allFees = [...feeSummary.setupFees, ...feeSummary.monthlyFees].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const unpaidCount = allFees.filter((f) => f.status === "unpaid").length;
  const paidCount = allFees.filter((f) => f.status === "paid").length;

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
          <h1 className="text-2xl font-bold">Branch Fees</h1>
          <p className="text-muted-foreground text-sm">{group.name}</p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">About Branch Fees</p>
            <p className="text-sm text-muted-foreground">
              Each branch has a one-time setup fee of {formatCurrency(BRANCH_FEES.SETUP)} and
              a monthly fee of {formatCurrency(BRANCH_FEES.MONTHLY)}. These fees help maintain
              the platform and provide support. Mark fees as paid after you've made the payment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <FeeSummaryCard
        totalUnpaid={feeSummary.totalUnpaid}
        totalPaid={feeSummary.totalPaid}
        unpaidCount={unpaidCount}
        paidCount={paidCount}
      />

      {/* Fee List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Fee History
          </CardTitle>
          <CardDescription>
            All fees for this branch. Mark fees as paid after payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeeTracker fees={allFees} branchId={groupId} />
        </CardContent>
      </Card>
    </div>
  );
}
