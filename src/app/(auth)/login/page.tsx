"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import {
  Loader2,
  Crown,
  Users,
  Shield,
  TrendingUp,
  UserPlus,
  Sparkles,
  Heart,
  Eye,
  EyeOff,
} from "lucide-react";
import { LegalDialogs } from "@/components/legal/legal-dialogs";
import { ThemeToggle } from "@/components/theme-toggle";

type UserRole = "organizer" | "member";
type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("member");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Set initial auth mode from URL parameter
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") {
      setAuthMode("signup");
    }
  }, [searchParams]);

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
        toast.success("Account created!");
        router.push("/onboarding");
        router.refresh();
      } else if (data.user && !data.session) {
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
      description: "Create and manage groups",
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50",
      borderColor: "border-amber-300",
      iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
    },
    member: {
      icon: Users,
      title: "Member",
      description: "Join and participate",
      gradient: "from-primary to-rose-500",
      bgGradient: "from-primary/5 to-rose-50",
      borderColor: "border-primary/30",
      iconBg: "bg-gradient-to-br from-primary to-rose-500",
    },
  };

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row overflow-hidden">
      {/* Left Panel - Decorative (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Deep terracotta gradient background - more sophisticated */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-800 to-rose-900" />
        {/* Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />

        {/* Animated floating shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl float" />
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-orange-400/15 rounded-full blur-3xl float-delayed" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-rose-400/10 rounded-full blur-2xl float" />

          {/* Decorative patterns */}
          <div className="absolute inset-0 pattern-banig opacity-30" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Pinoy Paluwagan"
              width={48}
              height={48}
              className="drop-shadow-lg"
              priority
            />
            <span className="text-2xl font-bold tracking-tight">Pinoy Paluwagan</span>
          </div>

          {/* Main content */}
          <div className="space-y-8 max-w-lg">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                Savings circles,
                <br />
                <span className="text-amber-300">reimagined.</span>
              </h1>
              <p className="text-lg text-white/80 leading-relaxed">
                Join thousands of Filipinos building financial resilience through
                trusted community savings. Transparent. Secure. Together.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  icon: Shield,
                  title: "Verified Members",
                  desc: "ID verification for trust & safety",
                },
                {
                  icon: TrendingUp,
                  title: "Track Everything",
                  desc: "Real-time contribution tracking",
                },
                {
                  icon: Heart,
                  title: "Bayanihan Spirit",
                  desc: "Community-powered savings",
                },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className={`flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 animate-slide-up-delayed stagger-${i + 1}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{feature.title}</p>
                    <p className="text-sm text-white/70">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-bold">10K+</p>
              <p className="text-sm text-white/70">Active Members</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-3xl font-bold">₱50M+</p>
              <p className="text-sm text-white/70">Managed Savings</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm text-white/70">Active Groups</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col min-h-dvh lg:min-h-0 bg-background relative">
        {/* Theme Toggle - Top Right */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        {/* Mobile header gradient */}
        <div className="lg:hidden absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-amber-900/10 via-orange-800/5 to-transparent" />

        {/* Decorative blobs - subtle and warm */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-orange-500/5 to-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center space-y-4 animate-fade-in">
              <div className="inline-flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Pinoy Paluwagan"
                  width={64}
                  height={64}
                  className="drop-shadow-lg"
                  priority
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">Pinoy Paluwagan</h1>
                <p className="text-muted-foreground mt-1">
                  Transparent savings circles for Filipinos
                </p>
              </div>
            </div>

            {/* Auth Card */}
            <div className="space-y-6 animate-slide-up">
              {/* Header */}
              <div className="text-center lg:text-left">
                <h2 className="text-2xl lg:text-3xl font-bold">
                  {authMode === "signin" ? "Welcome back" : "Join the community"}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {authMode === "signin"
                    ? "Sign in to manage your paluwagan groups"
                    : "Create your account and start saving together"}
                </p>
              </div>

              {/* Role Selection - Only shown for signup */}
              {authMode === "signup" && (
                <div className="space-y-3 animate-fade-in">
                  <Label className="text-sm font-medium">I want to join as</Label>
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
                            relative p-4 rounded-2xl border-2 transition-all duration-300
                            ${
                              isSelected
                                ? `bg-gradient-to-br ${config.bgGradient} ${config.borderColor} shadow-lg`
                                : "bg-card border-border hover:border-muted-foreground/30 hover:shadow-md"
                            }
                          `}
                        >
                          <div className="flex flex-col items-center text-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                isSelected
                                  ? `${config.iconBg} text-white shadow-md`
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-semibold">{config.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {config.description}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1">
                              <div className={`w-5 h-5 rounded-full ${config.iconBg} flex items-center justify-center`}>
                                <Sparkles className="w-3 h-3 text-white" />
                              </div>
                            </div>
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
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={
                        authMode === "signup"
                          ? "Create a password (min 6 chars)"
                          : "Enter your password"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-12 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-12"
                      autoComplete={
                        authMode === "signup" ? "new-password" : "current-password"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {authMode === "signup" && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-12 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-12"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold btn-tropical"
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
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {authMode === "signin"
                    ? "Don't have an account?"
                    : "Already have an account?"}
                  <button
                    type="button"
                    onClick={() => {
                      const newMode = authMode === "signin" ? "signup" : "signin";
                      setAuthMode(newMode);
                      setPassword("");
                      setConfirmPassword("");
                      setShowPassword(false);
                      setShowConfirmPassword(false);
                      // Update URL to reflect the mode
                      router.replace(newMode === "signup" ? "/login?mode=signup" : "/login", { scroll: false });
                    }}
                    className="ml-1 text-primary font-semibold hover:underline underline-offset-4"
                  >
                    {authMode === "signin" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </div>

            {/* Terms */}
            <LegalDialogs>
              {(openDialog) => (
                <p className="text-center text-xs text-muted-foreground px-4 animate-fade-in">
                  By continuing, you agree to our{" "}
                  <button
                    type="button"
                    onClick={() => openDialog("terms")}
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => openDialog("privacy")}
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </button>
                </p>
              )}
            </LegalDialogs>
          </div>
        </div>
      </div>
    </div>
  );
}
