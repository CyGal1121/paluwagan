"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2, Receipt, Calendar, Gift } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { markFeePaid, waiveFee } from "@/lib/actions/fee";
import { toast } from "sonner";
import type { BranchFee } from "@/types/database";

interface FeeTrackerProps {
  fees: BranchFee[];
  branchId: string;
}

type FeeAction = {
  type: "pay" | "waive";
  fee: BranchFee;
};

export function FeeTracker({ fees, branchId }: FeeTrackerProps) {
  const [actionFee, setActionFee] = useState<FeeAction | null>(null);
  const [waiveReason, setWaiveReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!actionFee || actionFee.type !== "pay") return;

    setLoading(true);
    const result = await markFeePaid(actionFee.fee.id, branchId);
    setLoading(false);

    if (result.success) {
      toast.success("Fee marked as paid");
    } else {
      toast.error(result.error || "Failed to mark fee as paid");
    }

    setActionFee(null);
  };

  const handleWaive = async () => {
    if (!actionFee || actionFee.type !== "waive" || !waiveReason.trim()) return;

    setLoading(true);
    const result = await waiveFee(actionFee.fee.id, branchId, waiveReason);
    setLoading(false);

    if (result.success) {
      toast.success("Fee waived successfully");
    } else {
      toast.error(result.error || "Failed to waive fee");
    }

    setActionFee(null);
    setWaiveReason("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="success">Paid</Badge>;
      case "waived":
        return <Badge variant="secondary">Waived</Badge>;
      case "unpaid":
      default:
        return <Badge variant="warning">Unpaid</Badge>;
    }
  };

  const getFeeIcon = (feeType: string) => {
    switch (feeType) {
      case "setup":
        return <Gift className="h-4 w-4" />;
      case "monthly":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  if (fees.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No fees yet</h3>
          <p className="text-muted-foreground text-sm">
            Fees will appear here as they are generated
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {fees.map((fee) => (
          <Card key={fee.id} className={fee.status === "unpaid" ? "border-warning/30" : ""}>
            <CardContent className="flex items-center justify-between p-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-muted rounded-full p-2">
                  {getFeeIcon(fee.fee_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium capitalize">
                      {fee.fee_type === "setup" ? "Setup Fee" : "Monthly Fee"}
                    </p>
                    {getStatusBadge(fee.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {fee.period_start && fee.period_end ? (
                      <>
                        {formatDate(fee.period_start)} - {formatDate(fee.period_end)}
                      </>
                    ) : fee.due_date ? (
                      <>Due: {formatDate(fee.due_date)}</>
                    ) : (
                      <>Created: {formatDate(fee.created_at)}</>
                    )}
                  </p>
                  {fee.paid_at && (
                    <p className="text-xs text-success">Paid on {formatDate(fee.paid_at)}</p>
                  )}
                  {fee.notes && (
                    <p className="text-xs text-muted-foreground italic">{fee.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="font-semibold text-lg">{formatCurrency(fee.amount)}</p>

                {fee.status === "unpaid" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActionFee({ type: "pay", fee })}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark Paid
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActionFee({ type: "waive", fee })}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Waive
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mark as Paid Dialog */}
      <AlertDialog
        open={actionFee?.type === "pay"}
        onOpenChange={(open) => !open && setActionFee(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Fee as Paid</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this{" "}
              {actionFee?.fee.fee_type === "setup" ? "setup" : "monthly"} fee of{" "}
              {actionFee && formatCurrency(actionFee.fee.amount)} as paid?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePay} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Waive Fee Dialog */}
      <AlertDialog
        open={actionFee?.type === "waive"}
        onOpenChange={(open) => {
          if (!open) {
            setActionFee(null);
            setWaiveReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Waive Fee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to waive this{" "}
              {actionFee?.fee.fee_type === "setup" ? "setup" : "monthly"} fee of{" "}
              {actionFee && formatCurrency(actionFee.fee.amount)}? Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="waive-reason">Reason for waiving</Label>
            <Input
              id="waive-reason"
              placeholder="e.g., Promotional offer, First month free"
              value={waiveReason}
              onChange={(e) => setWaiveReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWaive}
              disabled={loading || !waiveReason.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Waive Fee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
