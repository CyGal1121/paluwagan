"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmContribution, disputeContribution } from "@/lib/actions/contribution";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MoreHorizontal, Check, X, Eye, Loader2 } from "lucide-react";
import type { Contribution } from "@/types/database";

interface LedgerActionsProps {
  contribution: Contribution;
  groupId: string;
}

export function LedgerActions({ contribution, groupId }: LedgerActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const handleConfirm = async () => {
    setIsLoading(true);
    const result = await confirmContribution(contribution.id);
    setIsLoading(false);

    if (result.success) {
      toast.success("Contribution confirmed");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to confirm");
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setIsLoading(true);
    const result = await disputeContribution(contribution.id, disputeReason);
    setIsLoading(false);

    if (result.success) {
      toast.success("Contribution disputed");
      setDisputeOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to dispute");
    }
  };

  const canConfirm = contribution.status === "pending_proof" || contribution.status === "unpaid";
  const canDispute = contribution.status !== "disputed";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {contribution.proof_url && (
            <>
              <DropdownMenuItem asChild>
                <a
                  href={contribution.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Proof
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {canConfirm && (
            <DropdownMenuItem onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Confirm Paid
            </DropdownMenuItem>
          )}

          {canDispute && (
            <DropdownMenuItem
              onClick={() => setDisputeOpen(true)}
              className="text-destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Mark Disputed
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispute Contribution</DialogTitle>
            <DialogDescription>
              Please provide a reason for disputing this contribution.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Enter the reason for dispute..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={3}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDispute}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
