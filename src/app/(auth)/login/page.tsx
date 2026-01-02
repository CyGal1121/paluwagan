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
import { toast } from "sonner";
import { Loader2, Crown, Users, Shield, TrendingUp, UserPlus } from "lucide-react";
import { LegalDialogs } from "@/components/legal/legal-dialogs";

type UserRole = "organizer" | "member";
type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("member");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (authMode === "signup" && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: userRole,
          },
        },
      });

      setIsLoading(false);

      if (error) {
        toast.error(error.message);
      } else if (data.session) {
        // Email confirmation is disabled - user is auto-signed in
        toast.success("Account created!");
        router.push("/onboarding");
        router.refresh();
      } else if (data.user && !data.session) {
        // Email confirmation is enabled - user needs to verify
        toast.success("Account created! Check your email to confirm.");
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

  const roleConfig = {
    organizer: {
      icon: Crown,
      title: "Organizer",
      description: "Create and manage paluwagan groups",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      selectedBg: "bg-amber-100",
    },
    member: {
      icon: Users,
      title: "Member",
      description: "Join and participate in groups",
      color: "text-primary",
      bgColor: "bg-primary/5",
      borderColor: "border-primary/20",
      selectedBg: "bg-primary/10",
    },
  };

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-background to-muted/50">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Logo & Branding */}
          <div className="text-center space-y-3">
            <img
              src="/logo.png"
              alt="Pinoy Paluwagan"
              className="w-20 h-20 mx-auto mb-2"
            />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Pinoy Paluwagan
            </h1>
            <p className="text-muted-foreground text-base max-w-xs mx-auto">
              Transparent and trusted savings circles for Filipinos
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl sm:text-2xl text-center">
                {authMode === "signin" ? "Welcome back" : "Create account"}
              </CardTitle>
              <CardDescription className="text-center">
                {authMode === "signin"
                  ? "Sign in to manage your paluwagan"
                  : "Join the community and start saving"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              {/* Role Selection - Only shown for signup */}
              {authMode === "signup" && (
                <div className="mb-6">
                  <Label className="text-sm font-medium mb-3 block">
                    I want to join as
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["organizer", "member"] as UserRole[]).map((role) => {
                      const config = roleConfig[role];
                      const Icon = config.icon;
                      const isSelected = userRole === role;

                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setUserRole(role)}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all duration-200
                            ${
                              isSelected
                                ? `${config.selectedBg} ${config.borderColor} border-2`
                                : "bg-card border-border hover:border-muted-foreground/30"
                            }
                          `}
                        >
                          <div className="flex flex-col items-center text-center gap-2">
                            <div
                              className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}
                            >
                              <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div>
                              <p
                                className={`font-semibold text-sm ${isSelected ? config.color : "text-foreground"}`}
                              >
                                {config.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {config.description}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div
                              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${role === "organizer" ? "bg-amber-500" : "bg-primary"}`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={
                      authMode === "signup"
                        ? "Create a password (min 6 chars)"
                        : "Enter your password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12"
                    autoComplete={
                      authMode === "signup" ? "new-password" : "current-password"
                    }
                  />
                </div>

                {authMode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-12"
                      autoComplete="new-password"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : authMode === "signup" ? (
                    <UserPlus className="mr-2 h-5 w-5" />
                  ) : null}
                  {authMode === "signin" ? "Sign In" : "Create Account"}
                </Button>
              </form>

              {/* Toggle Auth Mode */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {authMode === "signin"
                    ? "Don't have an account?"
                    : "Already have an account?"}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === "signin" ? "signup" : "signin");
                      setPassword("");
                      setConfirmPassword("");
                    }}
                    className="ml-1 text-primary font-medium hover:underline"
                  >
                    {authMode === "signin" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Group Savings</p>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-success/10">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <p className="text-xs text-muted-foreground">Transparent</p>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <p className="text-xs text-muted-foreground">Track Progress</p>
            </div>
          </div>

          {/* Terms */}
          <LegalDialogs>
            {(openDialog) => (
              <p className="text-center text-xs text-muted-foreground px-4">
                By continuing, you agree to our{" "}
                <button
                  type="button"
                  onClick={() => openDialog("terms")}
                  className="underline hover:text-foreground transition-colors"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => openDialog("privacy")}
                  className="underline hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </button>.
              </p>
            )}
          </LegalDialogs>
        </div>
      </div>
    </div>
  );
}
