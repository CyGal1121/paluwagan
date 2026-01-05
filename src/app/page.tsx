import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Shield,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Banknote,
  CalendarCheck,
  Lock,
  Zap,
  Star,
  ChevronRight,
  Smartphone,
  Globe,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Logo size="md" />
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/login?mode=signup">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-6 animate-in delay-1">
                <Star className="h-4 w-4 fill-current" />
                Trusted by Filipino communities
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-display font-semibold leading-[1.1] text-foreground mb-6 animate-in delay-2">
                The modern way to manage{" "}
                <span className="text-primary">paluwagan</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mb-8 animate-in delay-3">
                Organize rotating savings circles with transparency and trust.
                Track contributions, manage payouts, and build financial
                resilience together.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-10 animate-in delay-4">
                <Button asChild size="lg" className="h-12 px-6 text-base">
                  <Link href="/login?mode=signup">
                    Start Your Circle
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 text-base"
                >
                  <Link href="#how-it-works">See How It Works</Link>
                </Button>
              </div>

              {/* Trust Stats */}
              <div className="grid grid-cols-3 gap-6 animate-in delay-5">
                {[
                  { value: "10K+", label: "Active Members" },
                  { value: "500+", label: "Savings Circles" },
                  { value: "99.9%", label: "Payout Rate" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl sm:text-3xl font-display font-semibold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Hero Image/Illustration */}
            <div className="relative hidden lg:block animate-in delay-3">
              {/* Phone Mockup */}
              <div className="relative mx-auto w-[320px]">
                {/* Phone Frame */}
                <div className="relative bg-foreground rounded-[3rem] p-3 shadow-dramatic">
                  <div className="bg-background rounded-[2.5rem] overflow-hidden">
                    {/* Status Bar */}
                    <div className="h-8 bg-muted/50 flex items-center justify-center">
                      <div className="w-20 h-1 bg-foreground/20 rounded-full" />
                    </div>

                    {/* App Screen Content */}
                    <div className="p-4 space-y-4 h-[480px]">
                      {/* App Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Welcome back,
                          </p>
                          <p className="font-semibold">Maria Santos</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            MS
                          </span>
                        </div>
                      </div>

                      {/* Balance Card */}
                      <div className="bg-primary rounded-xl p-4 text-primary-foreground">
                        <p className="text-xs opacity-80">Your Next Payout</p>
                        <p className="text-2xl font-display font-semibold mt-1">
                          ₱25,000
                        </p>
                        <p className="text-xs opacity-80 mt-2">
                          December 15, 2025
                        </p>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">
                            Contributed
                          </p>
                          <p className="font-semibold">₱15,000</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">
                            Members
                          </p>
                          <p className="font-semibold">10/10</p>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Recent Activity
                        </p>
                        <div className="space-y-2">
                          {[
                            { name: "Juan D.", action: "contributed", time: "2h ago" },
                            { name: "Ana R.", action: "contributed", time: "5h ago" },
                            { name: "Pedro L.", action: "joined", time: "1d ago" },
                          ].map((activity, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {activity.name.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">
                                  <span className="font-medium">
                                    {activity.name}
                                  </span>{" "}
                                  {activity.action}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {activity.time}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />

                {/* Floating Cards */}
                <div className="absolute -left-16 top-1/4 bg-card rounded-xl p-3 shadow-elevated border border-border animate-in delay-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">Payment Received</p>
                      <p className="text-xs text-muted-foreground">₱2,500</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-12 bottom-1/3 bg-card rounded-xl p-3 shadow-elevated border border-border animate-in delay-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">Circle Complete</p>
                      <p className="text-xs text-muted-foreground">10 members</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Logos/Partners */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted by communities across the Philippines
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
            {[
              { icon: Globe, text: "NCR" },
              { icon: Heart, text: "Cebu" },
              { icon: Users, text: "Davao" },
              { icon: Smartphone, text: "Pampanga" },
              { icon: Star, text: "Iloilo" },
            ].map((region) => (
              <div
                key={region.text}
                className="flex items-center gap-2 text-muted-foreground/60"
              >
                <region.icon className="h-5 w-5" />
                <span className="font-medium">{region.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-16 lg:py-24"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-semibold mb-4">
              How Paluwagan Works
            </h2>
            <p className="text-muted-foreground text-lg">
              A time-tested Filipino tradition, modernized for today. Simple,
              transparent, and built on trust.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                step: "01",
                icon: Users,
                title: "Form Your Circle",
                description:
                  "Create a group with 10 members. Each person commits to regular contributions over a fixed period.",
                color: "bg-primary/10 text-primary",
              },
              {
                step: "02",
                icon: Banknote,
                title: "Contribute Together",
                description:
                  "Everyone pays the same amount each cycle. All contributions are tracked transparently in real-time.",
                color: "bg-accent/10 text-accent",
              },
              {
                step: "03",
                icon: CalendarCheck,
                title: "Receive Payouts",
                description:
                  "Each cycle, one member receives the pooled amount. Everyone gets their turn until the circle completes.",
                color: "bg-success/10 text-success",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative bg-card rounded-xl p-6 border border-border shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
              >
                <span className="absolute top-6 right-6 text-5xl font-display font-semibold text-muted/20">
                  {item.step}
                </span>
                <div
                  className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4`}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Process Flow Illustration */}
          <div className="mt-16 hidden lg:block">
            <div className="relative bg-muted/30 rounded-2xl p-8 border border-border">
              <div className="flex items-center justify-between">
                {/* Timeline */}
                <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-border -translate-y-1/2" />

                {[
                  { week: "Week 1", action: "Everyone contributes ₱2,500", highlight: false },
                  { week: "Week 2", action: "Maria receives ₱25,000", highlight: true },
                  { week: "Week 3", action: "Juan's turn for payout", highlight: false },
                  { week: "Week 10", action: "Circle completes", highlight: false },
                ].map((item, i) => (
                  <div
                    key={item.week}
                    className="relative flex flex-col items-center text-center z-10"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                        item.highlight
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border-2 border-border text-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <p className="font-semibold text-sm">{item.week}</p>
                    <p className="text-xs text-muted-foreground max-w-[120px] mt-1">
                      {item.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24 bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <h2 className="text-3xl sm:text-4xl font-display font-semibold mb-4">
                Built for trust and transparency
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                We took the traditional paluwagan and made it better. Every
                feature is designed to build confidence and eliminate
                uncertainty.
              </p>

              <div className="space-y-4">
                {[
                  "Member verification with valid ID",
                  "Real-time contribution tracking",
                  "Automatic payout scheduling",
                  "Complete audit trail for all transactions",
                  "Mobile-first design for easy access",
                  "Secure and encrypted data",
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-3.5 w-3.5 text-success" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button asChild>
                  <Link href="/login?mode=signup">
                    Start for Free
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {[
                {
                  icon: Shield,
                  title: "Verified Members",
                  description:
                    "Every member is verified with photo and government ID before joining any circle.",
                  iconBg: "bg-primary/10 text-primary",
                },
                {
                  icon: BarChart3,
                  title: "Live Dashboard",
                  description:
                    "Track all contributions, view payout schedules, and monitor your circle's progress.",
                  iconBg: "bg-accent/10 text-accent",
                },
                {
                  icon: Lock,
                  title: "Bank-Grade Security",
                  description:
                    "Your data is encrypted and protected with industry-standard security measures.",
                  iconBg: "bg-success/10 text-success",
                },
                {
                  icon: Zap,
                  title: "Instant Updates",
                  description:
                    "Get notified when members contribute and when it's your turn for a payout.",
                  iconBg: "bg-warning/10 text-warning",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex gap-4 p-5 bg-card rounded-xl border border-border shadow-soft hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${feature.iconBg} flex items-center justify-center flex-shrink-0`}
                  >
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial/Quote */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <blockquote className="text-2xl sm:text-3xl font-display font-medium text-foreground mb-6 leading-relaxed">
            "Paluwagan helped our barangay organize savings circles that
            actually work. No more confusion about who paid what or when
            payouts happen."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <span className="font-semibold text-foreground">MR</span>
            </div>
            <div className="text-left">
              <p className="font-semibold">Maria Reyes</p>
              <p className="text-sm text-muted-foreground">
                Community Organizer, Quezon City
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-display font-semibold mb-4">
              Ready to start saving together?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Join thousands of Filipinos who are building financial resilience
              through community savings.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-background text-foreground hover:bg-background/90 h-12 px-8"
            >
              <Link href="/login?mode=signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Pinoy Paluwagan. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
