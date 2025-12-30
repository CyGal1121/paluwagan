"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"magic" | "password">("magic");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for the magic link!");
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      setIsLoading(false);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email to confirm your account!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setIsLoading(false);

      if (error) {
        toast.error(error.message);
      } else {
        router.push("/home");
        router.refresh();
      }
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Pinoy Paluwagan</h1>
          <p className="text-muted-foreground">
            Transparent and trusted savings circles for Filipinos
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>Sign in to manage your paluwagan groups</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={authMode}
              onValueChange={(v) => setAuthMode(v as "magic" | "password")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="magic">Magic Link</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>

              <TabsContent value="magic" className="space-y-4 mt-4">
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-magic">Email</Label>
                    <Input
                      id="email-magic"
                      type="email"
                      placeholder="juan@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    Send Magic Link
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="password" className="space-y-4 mt-4">
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-password">Email</Label>
                    <Input
                      id="email-password"
                      type="email"
                      placeholder="juan@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={isLoading}
                      onClick={(e) => handlePasswordAuth(e, true)}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign Up
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isLoading}
                      onClick={(e) => handlePasswordAuth(e, false)}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
