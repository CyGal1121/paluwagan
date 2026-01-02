"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, CheckCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BRANCH_FEES } from "@/types/database";

interface FeeSummaryCardProps {
  totalUnpaid: number;
  totalPaid: number;
  unpaidCount: number;
  paidCount: number;
}

export function FeeSummaryCard({
  totalUnpaid,
  totalPaid,
  unpaidCount,
  paidCount,
}: FeeSummaryCardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Fee Structure */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Fee Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Setup Fee</span>
              <span className="font-medium">{formatCurrency(BRANCH_FEES.SETUP)}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Fee</span>
              <span className="font-medium">{formatCurrency(BRANCH_FEES.MONTHLY)}/mo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outstanding */}
      <Card className={totalUnpaid > 0 ? "border-warning/50" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Outstanding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${totalUnpaid > 0 ? "text-warning" : ""}`}>
            {formatCurrency(totalUnpaid)}
          </p>
          <p className="text-xs text-muted-foreground">
            {unpaidCount} unpaid {unpaidCount === 1 ? "fee" : "fees"}
          </p>
        </CardContent>
      </Card>

      {/* Paid */}
      <Card className="border-success/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Total Paid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-success">
            {formatCurrency(totalPaid)}
          </p>
          <p className="text-xs text-muted-foreground">
            {paidCount} paid {paidCount === 1 ? "fee" : "fees"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
