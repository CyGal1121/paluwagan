import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, ShieldCheck, User, Edit, ChevronRight } from "lucide-react";
import { VerificationBadge } from "@/components/verification";
import { getInitials } from "@/lib/utils";

export const metadata = {
  title: "Profile | Pinoy Paluwagan",
  description: "View and manage your profile",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userDataRaw } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!userDataRaw) {
    redirect("/onboarding");
  }

  type UserData = {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    photo_url: string | null;
    id_verification_status: string | null;
    id_verified_at: string | null;
    created_at: string;
  };

  const userData = userDataRaw as UserData;

  const verificationStatus = (userData.id_verification_status as "none" | "pending" | "verified" | "rejected") || "none";
  const isVerified = verificationStatus === "verified";

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
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                  <AvatarImage src={userData.photo_url || ""} alt={userData.name || "User"} />
                  <AvatarFallback className="text-2xl">
                    {userData.name ? getInitials(userData.name) : <User className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">{userData.name || "No name set"}</h1>
                <div className="mt-1">
                  <VerificationBadge status={verificationStatus} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification CTA */}
        {!isVerified && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 rounded-full p-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Complete Verification</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verify your identity to create and join branches.
                  </p>
                  <Button asChild size="sm" className="mt-3">
                    <Link href="/profile/verify">
                      {verificationStatus === "pending" ? "View Status" : "Get Verified"}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-full p-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{userData.email || user.email || "Not set"}</p>
              </div>
            </div>
            {userData.phone && (
              <div className="flex items-center gap-3">
                <div className="bg-muted rounded-full p-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{userData.phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {new Date(userData.created_at).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            {isVerified && userData.id_verified_at && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified On</p>
                  <p className="font-medium">
                    {new Date(userData.id_verified_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-between" asChild>
            <Link href="/profile/edit">
              <span className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          {isVerified && (
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/profile/verify">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  View Verification
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
