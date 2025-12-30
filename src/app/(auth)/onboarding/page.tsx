"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, User, Camera } from "lucide-react";
import { getInitials } from "@/lib/utils";

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
      const { error } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          photo_url: uploadedPhotoUrl,
        })
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
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Pinoy Paluwagan</h1>
          <p className="text-muted-foreground">Let&apos;s set up your profile</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Your Profile</CardTitle>
            <CardDescription>
              This is how you&apos;ll appear to your group members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={photoUrl || ""} alt="Profile photo" />
                    <AvatarFallback className="text-2xl bg-primary/10">
                      {name ? getInitials(name) : <User className="w-8 h-8 text-muted-foreground" />}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="photo"
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
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

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan dela Cruz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Enter the name you want your group to see
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
