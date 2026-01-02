"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, User, Camera, ArrowRight } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Database } from "@/types/database";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Photo must be less than 2MB");
        return;
      }
      setPhotoFile(file);
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Not authenticated");
        router.push("/login");
        return;
      }

      let uploadedPhotoUrl = null;

      // Upload photo if selected
      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop();
        const filePath = `avatars/${user.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("proofs")
          .upload(filePath, photoFile, { upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("proofs").getPublicUrl(filePath);
          uploadedPhotoUrl = publicUrl;
        }
      }

      // Update user profile
      const updateData: UserUpdate = {
        name: name.trim(),
        photo_url: uploadedPhotoUrl,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("users")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to save profile");
        console.error(error);
        return;
      }

      toast.success("Profile saved!");
      router.push("/home");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-background to-muted/50">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <img
              src="/logo.png"
              alt="Pinoy Paluwagan"
              className="w-16 h-16 mx-auto mb-2"
            />
            <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              Step 1 of 1
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Complete Your Profile
            </h1>
            <p className="text-muted-foreground text-base max-w-xs mx-auto">
              Let your group members know who you are
            </p>
          </div>

          {/* Profile Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center">Your Profile</CardTitle>
              <CardDescription className="text-center">
                This is how you&apos;ll appear to your group
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex justify-center">
                  <div className="relative group">
                    <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-background shadow-lg">
                      <AvatarImage src={photoUrl || ""} alt="Profile photo" />
                      <AvatarFallback className="text-3xl bg-muted">
                        {name ? (
                          getInitials(name)
                        ) : (
                          <User className="w-12 h-12 text-muted-foreground" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="photo"
                      className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full p-2.5 cursor-pointer hover:bg-primary/90 transition-all shadow-md hover:scale-105"
                    >
                      <Camera className="w-5 h-5" />
                      <input
                        id="photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Juan dela Cruz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                    className="h-12 text-base"
                    autoComplete="name"
                  />
                  <p className="text-xs text-muted-foreground">
                    This name will be visible to your paluwagan group members
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isLoading || !name.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Skip Option */}
          <p className="text-center text-sm text-muted-foreground">
            You can always update your profile later in settings
          </p>
        </div>
      </div>
    </div>
  );
}
