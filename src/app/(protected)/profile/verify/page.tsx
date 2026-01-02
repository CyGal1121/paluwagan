import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { IdUploadForm } from "@/components/verification";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Verify Your Identity | Pinoy Paluwagan",
  description: "Upload your photo and ID to get verified",
};

export default async function VerifyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("name, photo_url, id_photo_url, id_verification_status, id_rejection_reason")
    .eq("id", user.id)
    .single();

  if (!userData) {
    redirect("/onboarding");
  }

  return (
    <div className="py-6 max-w-lg mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Verify Your Identity</h1>
          <p className="text-muted-foreground">
            Verification is required to create or join branches. This helps keep our community safe and trusted.
          </p>
        </div>

        {/* Upload Form */}
        <IdUploadForm
          userName={userData.name}
          currentPhotoUrl={userData.photo_url}
          currentIdPhotoUrl={userData.id_photo_url}
          verificationStatus={
            (userData.id_verification_status as "none" | "pending" | "verified" | "rejected") || "none"
          }
          rejectionReason={userData.id_rejection_reason}
        />
      </div>
    </div>
  );
}
