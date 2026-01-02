"use client";

import { useState } from "react";
import { createInvite, sendEmailInvite, sendSmsInvite } from "@/lib/actions/group";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Share2, Copy, Check, Loader2, Mail, Link2, Phone } from "lucide-react";

interface InviteDialogProps {
  groupId: string;
  groupName: string;
}

type InviteMode = "choose" | "link" | "email" | "sms";

export function InviteDialog({ groupId, groupName }: InviteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<InviteMode>("choose");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  const resetState = () => {
    setMode("choose");
    setInviteUrl(null);
    setCopied(false);
    setEmail("");
    setPhone("");
    setInviteSent(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  };

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

  const handleSendEmail = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    const result = await sendEmailInvite(groupId, email.trim());
    setIsLoading(false);

    if (result.success) {
      setInviteSent(true);
      toast.success(`Invitation sent to ${email}`);
    } else {
      toast.error(result.error || "Failed to send invitation");
    }
  };

  const handleSendSms = async () => {
    if (!phone.trim()) {
      toast.error("Please enter a mobile number");
      return;
    }

    setIsLoading(true);
    const result = await sendSmsInvite(groupId, phone.trim());
    setIsLoading(false);

    if (result.success) {
      setInviteSent(true);
      toast.success(`Invitation sent to ${phone}`);
    } else {
      toast.error(result.error || "Failed to send invitation");
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
      } catch {
        // User cancelled or share failed
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleInviteAnother = () => {
    setEmail("");
    setPhone("");
    setInviteSent(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
            Invite new members to join {groupName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selection */}
          {mode === "choose" && (
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => setMode("sms")}
              >
                <Phone className="mr-3 h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Send SMS Invitation</p>
                  <p className="text-xs text-muted-foreground">
                    Invite via mobile number (recommended for PH)
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => setMode("email")}
              >
                <Mail className="mr-3 h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Send Email Invitation</p>
                  <p className="text-xs text-muted-foreground">
                    Invite via email address
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => {
                  setMode("link");
                  handleCreateInvite();
                }}
              >
                <Link2 className="mr-3 h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Generate Invite Link</p>
                  <p className="text-xs text-muted-foreground">
                    Create a shareable link for anyone to join
                  </p>
                </div>
              </Button>
            </div>
          )}

          {/* SMS Invite Mode */}
          {mode === "sms" && !inviteSent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09171234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendSms();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a Philippine mobile number (e.g., 09171234567 or +639171234567)
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setMode("choose")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSendSms}
                  disabled={isLoading || !phone.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Phone className="mr-2 h-4 w-4" />
                  )}
                  Send SMS
                </Button>
              </div>
            </div>
          )}

          {/* Email Invite Mode */}
          {mode === "email" && !inviteSent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="member@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendEmail();
                    }
                  }}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setMode("choose")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={isLoading || !email.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send Email
                </Button>
              </div>
            </div>
          )}

          {/* Invite Sent Success (for both email and SMS) */}
          {(mode === "email" || mode === "sms") && inviteSent && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                  <Check className="h-6 w-6 text-success" />
                </div>
                <p className="font-medium">Invitation Sent!</p>
                <p className="text-sm text-muted-foreground">
                  We sent an invitation to {mode === "email" ? email : phone}
                </p>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleInviteAnother}
                  className="flex-1"
                >
                  {mode === "sms" ? (
                    <Phone className="mr-2 h-4 w-4" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Invite Another
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Link Invite Mode */}
          {mode === "link" && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : inviteUrl ? (
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

                  <Separator />

                  <Button
                    variant="ghost"
                    onClick={() => setMode("choose")}
                    className="w-full"
                  >
                    Back to Options
                  </Button>
                </>
              ) : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
