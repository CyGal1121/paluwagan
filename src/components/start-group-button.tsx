"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Play, Loader2 } from "lucide-react";
import { startGroup } from "@/lib/actions/cycle";

interface StartGroupButtonProps {
  groupId: string;
  memberCount: number;
}

export function StartGroupButton({ groupId, memberCount }: StartGroupButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    const result = await startGroup(groupId);
    setIsLoading(false);

    if (result.success) {
      toast.success("Group started! Cycles have been generated.");
      setIsOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to start group");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Play className="mr-2 h-4 w-4" />
          Start Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Group?</DialogTitle>
          <DialogDescription>
            This will activate the group with {memberCount} members and generate all cycles. New
            members can still join if spots are available.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Wait for More Members
          </Button>
          <Button onClick={handleStart} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
