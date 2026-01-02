"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Camera, IdCard, Upload, CheckCircle2, User } from "lucide-react";
import { uploadIdPhoto, uploadProfilePhoto, submitForVerification } from "@/lib/actions/user";
import { getInitials } from "@/lib/utils";
import { VerificationStatus } from "./verification-status";

interface IdUploadFormProps {
  userName: string | null;
  currentPhotoUrl: string | null;
  currentIdPhotoUrl: string | null;
  verificationStatus: "none" | "pending" | "verified" | "rejected";
  rejectionReason: string | null;
}

export function IdUploadForm({
  userName,
  currentPhotoUrl,
  currentIdPhotoUrl,
  verificationStatus,
  rejectionReason,
}: IdUploadFormProps) {
  const router = useRouter();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);
  const [idPhotoUrl, setIdPhotoUrl] = useState(currentIdPhotoUrl);

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadProfilePhoto(formData);

      if (result.success && result.data) {
        setPhotoUrl(result.data.url);
        toast.success("Profile photo uploaded");
      } else {
        toast.error(result.error || "Failed to upload photo");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsUploadingPhoto(false);
    }
  }, []);

  const handleIdUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingId(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadIdPhoto(formData);

      if (result.success && result.data) {
        setIdPhotoUrl(result.data.url);
        toast.success("ID photo uploaded");
      } else {
        toast.error(result.error || "Failed to upload ID");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsUploadingId(false);
    }
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitForVerification();

      if (result.success) {
        toast.success("Submitted for verification!");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to submit");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = photoUrl && idPhotoUrl && verificationStatus !== "pending" && verificationStatus !== "verified";
  const isVerified = verificationStatus === "verified";
  const isPending = verificationStatus === "pending";

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <VerificationStatus status={verificationStatus} rejectionReason={rejectionReason} />

      {/* Photo Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Photo
          </CardTitle>
          <CardDescription>
            A clear photo of your face for identification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-muted">
                <AvatarImage src={photoUrl || ""} alt="Profile photo" />
                <AvatarFallback className="text-2xl">
                  {userName ? getInitials(userName) : <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
              {photoUrl && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="photo-upload">
                <div
                  className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isUploadingPhoto ? "bg-muted" : "hover:bg-muted/50"
                  } ${isVerified ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {photoUrl ? "Change photo" : "Upload photo"}
                      </span>
                    </>
                  )}
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto || isVerified}
                  className="sr-only"
                />
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Max 2MB. JPEG, PNG, or WebP.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ID Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IdCard className="h-5 w-5" />
            Government ID
          </CardTitle>
          <CardDescription>
            A clear photo of a valid government-issued ID (Driver&apos;s License, Passport, National ID, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {idPhotoUrl ? (
              <div className="relative rounded-lg overflow-hidden border">
                <img
                  src={idPhotoUrl}
                  alt="ID Photo"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <IdCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No ID uploaded yet</p>
                </div>
              </div>
            )}
            <label htmlFor="id-upload">
              <div
                className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isUploadingId ? "bg-muted" : "hover:bg-muted/50"
                } ${isVerified ? "opacity-50 pointer-events-none" : ""}`}
              >
                {isUploadingId ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {idPhotoUrl ? "Change ID photo" : "Upload ID photo"}
                    </span>
                  </>
                )}
              </div>
              <input
                id="id-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleIdUpload}
                disabled={isUploadingId || isVerified}
                className="sr-only"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Max 5MB. JPEG, PNG, or WebP. Make sure all details are clearly visible.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      {!isVerified && (
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting || isPending}
          className="w-full h-12"
          size="lg"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : isPending ? (
            "Awaiting Review..."
          ) : (
            "Submit for Verification"
          )}
        </Button>
      )}

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-medium mb-2">Tips for quick approval:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use a clear, well-lit photo for your profile</li>
            <li>• Make sure your ID photo shows all corners of the document</li>
            <li>• Ensure text on your ID is readable</li>
            <li>• Avoid glare or reflections on the ID</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
