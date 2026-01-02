"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Wallet, AlertCircle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MEMBERSHIP_LIMITS } from "@/types/database";

interface MembershipStatusCardProps {
  branchCount: number;
  monthlyTotal: number;
  remainingBranches: number;
  remainingBudget: number;
  branches?: Array<{
    id: string;
    name: string;
    monthlyEquivalent: number;
    frequency: string;
  }>;
  showDetails?: boolean;
  compact?: boolean;
}

export function MembershipStatusCard({
  branchCount,
  monthlyTotal,
  remainingBranches,
  remainingBudget,
  branches = [],
  showDetails = false,
  compact = false,
}: MembershipStatusCardProps) {
  const branchPercentage = (branchCount / MEMBERSHIP_LIMITS.MAX_BRANCHES) * 100;
  const budgetPercentage = (monthlyTotal / MEMBERSHIP_LIMITS.MAX_MONTHLY_CONTRIBUTION) * 100;

  const isAtBranchLimit = remainingBranches === 0;
  const isAtBudgetLimit = remainingBudget <= 0;
  const isNearLimit = branchPercentage >= 66 || budgetPercentage >= 66;

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className={isAtBranchLimit ? "text-destructive font-medium" : ""}>
            {branchCount}/{MEMBERSHIP_LIMITS.MAX_BRANCHES} branches
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className={isAtBudgetLimit ? "text-destructive font-medium" : ""}>
            {formatCurrency(monthlyTotal)}/{formatCurrency(MEMBERSHIP_LIMITS.MAX_MONTHLY_CONTRIBUTION)}/mo
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Membership Status</CardTitle>
            <CardDescription>Your current branch limits</CardDescription>
          </div>
          {isAtBranchLimit || isAtBudgetLimit ? (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Limit Reached
            </Badge>
          ) : isNearLimit ? (
            <Badge variant="warning" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Near Limit
            </Badge>
          ) : (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Available
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Branch Count */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Branches Joined</span>
            </div>
            <span className={isAtBranchLimit ? "text-destructive font-medium" : "font-medium"}>
              {branchCount} / {MEMBERSHIP_LIMITS.MAX_BRANCHES}
            </span>
          </div>
          <Progress
            value={branchPercentage}
            className="h-2"
            indicatorClassName={isAtBranchLimit ? "bg-destructive" : branchPercentage >= 66 ? "bg-warning" : "bg-primary"}
          />
          {remainingBranches > 0 && (
            <p className="text-xs text-muted-foreground">
              You can join {remainingBranches} more branch{remainingBranches !== 1 ? "es" : ""}
            </p>
          )}
        </div>

        {/* Monthly Contribution */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span>Monthly Contribution</span>
            </div>
            <span className={isAtBudgetLimit ? "text-destructive font-medium" : "font-medium"}>
              {formatCurrency(monthlyTotal)} / {formatCurrency(MEMBERSHIP_LIMITS.MAX_MONTHLY_CONTRIBUTION)}
            </span>
          </div>
          <Progress
            value={budgetPercentage}
            className="h-2"
            indicatorClassName={isAtBudgetLimit ? "bg-destructive" : budgetPercentage >= 66 ? "bg-warning" : "bg-primary"}
          />
          {remainingBudget > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatCurrency(remainingBudget)} monthly budget remaining
            </p>
          )}
        </div>

        {/* Branch Details */}
        {showDetails && branches.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Your Branches</p>
            <div className="space-y-1.5">
              {branches.map((branch) => (
                <div key={branch.id} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[180px]">{branch.name}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(branch.monthlyEquivalent)}/mo
                    <span className="text-xs ml-1">({branch.frequency})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Message */}
        {(isAtBranchLimit || isAtBudgetLimit) && (
          <div className="pt-2 border-t">
            <p className="text-xs text-destructive">
              {isAtBranchLimit && isAtBudgetLimit
                ? "You've reached both your branch and budget limits. Leave a branch to join another."
                : isAtBranchLimit
                  ? "You've reached your maximum of 3 branches. Leave a branch to join another."
                  : "You've reached your monthly contribution limit of ₱3,000."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
