"use client";

import { useState } from "react";
import { createInvite } from "@/lib/actions/group";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Share2, Copy, Check, Loader2 } from "lucide-react";

interface InviteDialogProps {
  groupId: string;
  groupName: string;
}

export function InviteDialog({ groupId, groupName }: InviteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateInvite = async () => {
    setIsLoading(true);
    const result = await createInvite(groupId);
    setIsLoading(false);

    if (result.success && result.data) {
      setInviteUrl(result.data.url);
    } else {
      toast.error(result.error || "Failed to create invite");
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (!inviteUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName}`,
          text: `You're invited to join ${groupName} on Pinoy Paluwagan!`,
          url: inviteUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Create an invite link to share with new members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!inviteUrl ? (
            <Button onClick={handleCreateInvite} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              Generate Invite Link
            </Button>
          ) : (
            <>
              <div className="flex gap-2">
                <Input value={inviteUrl} readOnly className="text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleShare} className="flex-1">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setInviteUrl(null);
                    handleCreateInvite();
                  }}
                >
                  New Link
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                This link expires in 7 days
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
