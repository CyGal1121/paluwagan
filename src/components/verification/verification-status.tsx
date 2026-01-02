"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

type VerificationStatus = "none" | "pending" | "verified" | "rejected";

interface VerificationStatusProps {
  status: VerificationStatus;
  rejectionReason?: string | null;
  compact?: boolean;
}

const statusConfig = {
  none: {
    label: "Not Verified",
    icon: AlertCircle,
    variant: "secondary" as const,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  pending: {
    label: "Pending Review",
    icon: Clock,
    variant: "warning" as const,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    variant: "success" as const,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    variant: "destructive" as const,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
};

export function VerificationStatus({
  status,
  rejectionReason,
  compact = false,
}: VerificationStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className={`rounded-lg p-4 ${config.bgColor}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${config.color}`} />
        <span className={`font-medium ${config.color}`}>{config.label}</span>
      </div>
      {status === "rejected" && rejectionReason && (
        <p className="mt-2 text-sm text-red-700">{rejectionReason}</p>
      )}
      {status === "pending" && (
        <p className="mt-2 text-sm text-amber-700">
          Your verification is being reviewed. This usually takes 1-2 business days.
        </p>
      )}
      {status === "none" && (
        <p className="mt-2 text-sm text-muted-foreground">
          Upload your photo and government ID to get verified.
        </p>
      )}
      {status === "verified" && (
        <p className="mt-2 text-sm text-emerald-700">
          You can now create and join branches.
        </p>
      )}
    </div>
  );
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <VerificationStatus status={status} compact />;
}
