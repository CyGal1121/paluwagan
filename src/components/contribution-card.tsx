"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitContribution, confirmContribution } from "@/lib/actions/contribution";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { Contribution } from "@/types/database";

interface ContributionCardProps {
  contribution: Contribution | null;
  cycleId: string;
  groupId: string;
  amount: number;
  dueDate: string;
  isOrganizer: boolean;
}

export function ContributionCard({
  contribution,
  cycleId,
  groupId,
  amount,
  dueDate,
  isOrganizer,
}: ContributionCardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const status = contribution?.status || "unpaid";
  const isLate = contribution?.is_late || new Date() > new Date(dueDate);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!contribution) return;

    setIsLoading(true);

    try {
      let proofUrl: string | undefined;

      // Upload proof if provided
      if (proofFile) {
        const fileExt = proofFile.name.split(".").pop();
        const fileName = `${groupId}/${contribution.user_id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("proofs")
          .upload(fileName, proofFile);

        if (uploadError) {
          toast.error("Failed to upload proof");
          setIsLoading(false);
          return;
        }

        const { data } = supabase.storage.from("proofs").getPublicUrl(fileName);
        proofUrl = data.publicUrl;
      }

      const result = await submitContribution(contribution.id, proofUrl, note);

      if (result.success) {
        toast.success("Contribution submitted!");
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to submit");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "paid_confirmed":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Paid
          </Badge>
        );
      case "pending_proof":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        );
      case "disputed":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Disputed
          </Badge>
        );
      default:
        return (
          <Badge variant={isLate ? "destructive" : "secondary"} className="gap-1">
            {isLate ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {isLate ? "Overdue" : "Unpaid"}
          </Badge>
        );
    }
  };

  return (
    <Card className={status === "paid_confirmed" ? "bg-success/5 border-success/20" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Your Contribution</p>
            <p className="text-lg font-semibold">{formatCurrency(amount)}</p>
            <p className="text-xs text-muted-foreground">Due: {formatDateShort(dueDate)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            {status === "unpaid" && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Submit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Contribution</DialogTitle>
                    <DialogDescription>
                      Upload proof of payment for {formatCurrency(amount)}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Proof Upload */}
                    <div className="space-y-2">
                      <Label>Proof of Payment (optional)</Label>
                      {proofPreview ? (
                        <div className="relative">
                          <img
                            src={proofPreview}
                            alt="Proof preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => {
                              setProofFile(null);
                              setProofPreview(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload image
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                      <Label>Note (optional)</Label>
                      <Textarea
                        placeholder="Add a note about your payment..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {status === "pending_proof" && contribution?.proof_url && (
              <a
                href={contribution.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View Proof
              </a>
            )}
          </div>
        </div>

        {contribution?.note && (
          <p className="mt-2 text-sm text-muted-foreground border-t pt-2">
            Note: {contribution.note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
