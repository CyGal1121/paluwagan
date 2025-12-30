"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { joinGroup } from "@/lib/actions/group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, LogIn, UserPlus } from "lucide-react";

interface JoinGroupFormProps {
  token: string;
  canJoin: boolean;
  isAuthenticated: boolean;
  groupId: string;
  existingStatus?: string;
}

export function JoinGroupForm({
  token,
  canJoin,
  isAuthenticated,
  groupId,
  existingStatus,
}: JoinGroupFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    setIsLoading(true);
    const result = await joinGroup(token);
    setIsLoading(false);

    if (result.success) {
      toast.success("Successfully joined the group!");
      router.push(`/groups/${result.data?.groupId}`);
    } else {
      toast.error(result.error || "Failed to join group");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-3">
        <p className="text-center text-sm text-muted-foreground">
          Sign in to join this group
        </p>
        <Button asChild className="w-full">
          <Link href={`/login?next=/invites/${token}`}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In to Join
          </Link>
        </Button>
      </div>
    );
  }

  if (existingStatus === "active") {
    return (
      <Button asChild className="w-full">
        <Link href={`/groups/${groupId}`}>View Group</Link>
      </Button>
    );
  }

  if (existingStatus === "pending") {
    return (
      <Button disabled className="w-full">
        Waiting for Approval
      </Button>
    );
  }

  if (!canJoin) {
    return (
      <Button disabled className="w-full">
        Cannot Join
      </Button>
    );
  }

  return (
    <Button onClick={handleJoin} disabled={isLoading} className="w-full">
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="mr-2 h-4 w-4" />
      )}
      Request to Join
    </Button>
  );
}
