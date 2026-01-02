"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveMember, removeMember, freezeMember, unfreezeMember } from "@/lib/actions/group";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { MoreHorizontal, Check, X, Snowflake, Loader2, Trash2 } from "lucide-react";

interface MemberActionsProps {
  groupId: string;
  userId: string;
  status: string;
  isOrganizer: boolean;
  isPendingApproval?: boolean;
}

export function MemberActions({
  groupId,
  userId,
  status,
  isOrganizer,
  isPendingApproval,
}: MemberActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    const result = await approveMember(groupId, userId);
    setIsLoading(false);

    if (result.success) {
      toast.success("Member approved");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to approve");
    }
  };

  const handleFreeze = async () => {
    setIsLoading(true);
    const result = await freezeMember(groupId, userId);
    setIsLoading(false);

    if (result.success) {
      toast.success("Member frozen");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to freeze");
    }
  };

  const handleUnfreeze = async () => {
    setIsLoading(true);
    const result = await unfreezeMember(groupId, userId);
    setIsLoading(false);

    if (result.success) {
      toast.success("Member unfrozen");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to unfreeze");
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    const result = await removeMember(groupId, userId);
    setIsLoading(false);

    if (result.success) {
      toast.success("Member removed");
      setRemoveDialogOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to remove");
    }
  };

  if (!isOrganizer) {
    return null;
  }

  if (isPendingApproval) {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRemoveDialogOpen(true)}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>

        <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Join Request?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reject the member&apos;s request to join the group.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemove} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Direct delete button for easy removal */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setRemoveDialogOpen(true)}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {status === "active" && (
              <DropdownMenuItem onClick={handleFreeze} disabled={isLoading}>
                <Snowflake className="mr-2 h-4 w-4" />
                Freeze Member
              </DropdownMenuItem>
            )}
            {status === "frozen" && (
              <DropdownMenuItem onClick={handleUnfreeze} disabled={isLoading}>
                <Check className="mr-2 h-4 w-4" />
                Unfreeze Member
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setRemoveDialogOpen(true)}
              className="text-destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Remove Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the member from the group. They will not be able to
              participate in future cycles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
