import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Users,
  ChevronRight,
  ShieldCheck,
  Wallet,
  Calendar,
  Sparkles,
  Smartphone,
  Tv,
  ArrowRight,
  Gift,
  Crown,
  HandCoins,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AlertsSection } from "@/components/alerts-section";
import { CategoryTabs } from "@/components/categories";
import { CategoryIcon } from "@/components/categories/category-icon";
import { getCategoriesWithBranchCounts } from "@/lib/actions/category";

interface HomePageProps {
  searchParams: Promise<{ category?: string }>;
}

async function WelcomeHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single<{ name: string | null }>();

  const firstName = userData?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Magandang umaga" : hour < 18 ? "Magandang hapon" : "Magandang gabi";

  return (
    <div className="space-y-1 animate-fade-in">
      <p className="text-sm text-muted-foreground font-medium">{greeting},</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-gradient">{firstName}!</h1>
    </div>
  );
}

async function QuickStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's active memberships
  const { data: memberships } = await supabase
    .from("group_members")
    .select(
      `
      role,
      groups (
        id,
        contribution_amount,
        frequency,
        status
      )
    `
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .returns<
      Array<{
        role: string;
        groups: { id: string; contribution_amount: number; frequency: string; status: string } | null;
      }>
    >();

  const activeBranches = memberships?.filter((m) => m.groups !== null).length || 0;
  const organizerCount =
    memberships?.filter((m) => m.role === "organizer" && m.groups !== null).length || 0;

  // Calculate monthly contribution
  let monthlyTotal = 0;
  memberships?.forEach((m) => {
    const group = m.groups as { contribution_amount: number; frequency: string } | null;
    if (group) {
      if (group.frequency === "weekly") {
        monthlyTotal += group.contribution_amount * 4;
      } else if (group.frequency === "biweekly") {
        monthlyTotal += group.contribution_amount * 2;
      } else {
        monthlyTotal += group.contribution_amount;
      }
    }
  });

  const stats = [
    {
      icon: Users,
      value: activeBranches,
      label: "Active Branches",
      gradient: "from-primary/15 to-rose-500/10",
      iconBg: "bg-gradient-to-br from-primary to-rose-500",
      delay: "stagger-1",
    },
    {
      icon: Crown,
      value: organizerCount,
      label: "As Organizer",
      gradient: "from-amber-500/15 to-orange-500/10",
      iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
      delay: "stagger-2",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={`card-organic bg-gradient-to-br ${stat.gradient} border-0 overflow-hidden animate-slide-up-delayed ${stat.delay}`}
        >
          <CardContent className="p-4 relative">
            {/* Decorative blob */}
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/20 blur-xl" />
            <div className="flex items-center gap-3 relative">
              <div className={`p-2.5 rounded-xl ${stat.iconBg} shadow-lg`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Monthly Contribution - spans 2 columns */}
      <Card className="card-organic bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/5 border-0 col-span-2 lg:col-span-2 overflow-hidden animate-slide-up-delayed stagger-3">
        <CardContent className="p-4 relative">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-emerald-400/10 blur-2xl" />
          <div className="absolute bottom-0 right-4 w-16 h-16 rounded-full bg-teal-400/10 blur-xl" />
          <div className="flex items-center gap-3 relative">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
              <p className="text-xs text-muted-foreground font-medium">Monthly Contribution</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function VerificationBanner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("id_verification_status, photo_url, id_photo_url")
    .eq("id", user.id)
    .single<{ id_verification_status: string | null; photo_url: string | null; id_photo_url: string | null }>();

  if (!userData) return null;

  const status = userData.id_verification_status || "none";

  // Don't show banner if verified
  if (status === "verified") return null;

  return (
    <Card className="border-0 bg-gradient-to-r from-primary/10 via-rose-500/10 to-amber-500/5 overflow-hidden animate-slide-up-delayed stagger-4">
      <CardContent className="flex items-center justify-between py-4 relative">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
        <div className="absolute left-10 bottom-0 w-20 h-20 bg-rose-500/5 rounded-full translate-y-1/2 blur-lg" />

        <div className="flex items-center gap-3 relative">
          <div className="bg-gradient-to-br from-primary to-rose-500 rounded-xl p-2.5 shadow-lg glow-coral">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">
              {status === "pending"
                ? "Verification in Progress"
                : "Complete Your Verification"}
            </p>
            <p className="text-xs text-muted-foreground">
              {status === "pending"
                ? "We're reviewing your documents. This usually takes 24-48 hours."
                : "Upload your photo and valid ID to create or join branches."}
            </p>
          </div>
        </div>
        <Button size="sm" className="relative z-10 btn-tropical rounded-xl" asChild>
          <Link href="/profile/verify">
            {status === "pending" ? "View Status" : "Get Verified"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function PautangPromotion() {
  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white animate-slide-up-delayed stagger-5">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row relative">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
            <div className="absolute inset-0 pattern-dots opacity-20" />
          </div>

          {/* Content */}
          <div className="flex-1 p-5 md:p-6 space-y-4 relative">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-full px-3">
                <Sparkles className="h-3 w-3 mr-1.5" />
                New Service
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-bold font-display">
                Pautang Appliances & Gadgets
              </h3>
              <p className="text-white/80 text-sm md:text-base leading-relaxed">
                Get the appliances and gadgets you need now, pay monthly at affordable rates.
                No credit card required!
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { icon: Smartphone, label: "Smartphones" },
                { icon: Tv, label: "Appliances" },
                { icon: Gift, label: "Easy Terms" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-sm bg-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm"
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <Button
              asChild
              className="bg-white text-purple-700 hover:bg-white/90 shadow-lg rounded-xl font-semibold mt-2"
            >
              <Link href="/pautang">
                Browse Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Decorative elements */}
          <div className="hidden md:flex items-center justify-center p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-purple-600/50" />
            <div className="relative grid grid-cols-2 gap-3">
              {[
                { icon: Smartphone, delay: "0" },
                { icon: Tv, delay: "100" },
                { icon: Wallet, delay: "200" },
                { icon: Calendar, delay: "300" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center float ${
                    i % 2 === 1 ? "translate-y-4" : i === 2 ? "-translate-y-2" : ""
                  }`}
                  style={{ animationDelay: `${item.delay}ms` }}
                >
                  <item.icon className="h-8 w-8 text-white/80" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function BranchesList({ categorySlug }: { categorySlug?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's branches with category info
  const { data: membershipsData } = await supabase
    .from("group_members")
    .select(
      `
      role,
      status,
      groups (
        id,
        name,
        contribution_amount,
        frequency,
        status,
        members_limit,
        category_id,
        categories (
          id,
          name,
          slug,
          icon
        )
      )
    `
    )
    .eq("user_id", user.id)
    .in("status", ["active", "pending"]);

  type MembershipType = {
    role: string;
    status: string;
    groups: {
      id: string;
      name: string;
      contribution_amount: number;
      frequency: string;
      status: string;
      members_limit: number;
      category_id: string | null;
      categories: {
        id: string;
        name: string;
        slug: string;
        icon: string | null;
      } | null;
    } | null;
  };

  const memberships = membershipsData as MembershipType[] | null;

  if (!memberships || memberships.length === 0) {
    return (
      <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-rose-500/10 mb-4">
            <HandCoins className="h-10 w-10 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-2">No branches yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            Start your savings journey by creating a new branch or joining one using an
            invite link from a friend.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="btn-tropical rounded-xl">
              <Link href="/groups/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Branch
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-xl border-2">
              <Link href="/discover">Discover Branches</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter out memberships with null groups and optionally by category
  let filteredMemberships = memberships.filter((m) => m.groups !== null);
  if (categorySlug) {
    filteredMemberships = filteredMemberships.filter((m) => {
      const group = m.groups as { categories?: { slug: string } | null };
      return group?.categories?.slug === categorySlug;
    });
  }

  if (filteredMemberships.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="p-4 rounded-2xl bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No branches in this category</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create a new branch in this category to get started.
          </p>
          <Button asChild className="btn-tropical rounded-xl">
            <Link href="/groups/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Branch
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredMemberships.map((membership, index) => {
        const group = membership.groups as {
          id: string;
          name: string;
          contribution_amount: number;
          frequency: string;
          status: string;
          members_limit: number;
          categories?: { name: string; slug: string; icon: string | null } | null;
        } | null;

        // Skip if group doesn't exist
        if (!group) return null;

        const isOrganizer = membership.role === "organizer";
        const isPending = membership.status === "pending";

        return (
          <Link key={group.id} href={`/groups/${group.id}`}>
            <Card
              className={`card-lift h-full group overflow-hidden relative transition-all duration-300 animate-slide-up-delayed stagger-${Math.min(index + 1, 6)} ${
                isOrganizer
                  ? "border-amber-400/40 bg-gradient-to-br from-amber-50/80 to-orange-50/50"
                  : "card-organic"
              }`}
            >
              {/* Decorative corner accent for organizers */}
              {isOrganizer && (
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-orange-500/10 rounded-bl-[4rem]" />
              )}

              <CardContent className="p-5 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {group.categories && (
                      <div
                        className={`p-2.5 rounded-xl shadow-sm ${
                          isOrganizer
                            ? "bg-gradient-to-br from-amber-400 to-orange-500"
                            : "bg-gradient-to-br from-primary to-rose-500"
                        }`}
                      >
                        <CategoryIcon
                          icon={group.categories.icon}
                          className="h-4 w-4 text-white"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold line-clamp-1">{group.name}</h3>
                      {group.categories && (
                        <p className="text-xs text-muted-foreground">
                          {group.categories.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xl font-bold text-gradient">
                      {formatCurrency(group.contribution_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize font-medium">
                      {group.frequency}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {isOrganizer && (
                      <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white text-xs border-0 rounded-full px-2.5">
                        <Crown className="h-3 w-3 mr-1" />
                        Organizer
                      </Badge>
                    )}
                    {isPending && (
                      <Badge variant="warning" className="text-xs rounded-full">
                        Pending
                      </Badge>
                    )}
                    {!isOrganizer && !isPending && (
                      <Badge variant="secondary" className="text-xs rounded-full">
                        Member
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function BranchesListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="card-organic">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-5" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-5 w-18 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2].map((i) => (
        <Card key={i} className="card-organic">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Card className="col-span-2 lg:col-span-2 card-organic">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryTabsSkeleton() {
  return (
    <div className="flex gap-2 p-1.5 bg-muted/50 rounded-xl overflow-x-auto">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-9 w-24 flex-shrink-0 rounded-lg" />
      ))}
    </div>
  );
}

async function CategoryTabsWrapper({ selectedSlug }: { selectedSlug?: string }) {
  const categories = await getCategoriesWithBranchCounts();
  return <CategoryTabs categories={categories} selectedSlug={selectedSlug} />;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const categorySlug = params.category;

  return (
    <div className="py-6 space-y-6 relative">
      {/* Background decorative elements */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/5 via-rose-500/3 to-transparent rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-500/5 via-orange-500/3 to-transparent rounded-full blur-3xl -z-10 translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      {/* Welcome Header */}
      <div className="flex items-start justify-between gap-4">
        <Suspense fallback={<Skeleton className="h-14 w-48" />}>
          <WelcomeHeader />
        </Suspense>
        <Button asChild className="hidden sm:flex btn-tropical rounded-xl shadow-lg">
          <Link href="/groups/new">
            <Plus className="mr-2 h-4 w-4" />
            New Branch
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <Suspense fallback={<QuickStatsSkeleton />}>
        <QuickStats />
      </Suspense>

      {/* Verification Banner */}
      <Suspense fallback={null}>
        <VerificationBanner />
      </Suspense>

      {/* Alerts */}
      <Suspense fallback={<AlertsSkeleton />}>
        <AlertsSection />
      </Suspense>

      {/* Pautang Promotion */}
      <PautangPromotion />

      {/* Branches Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display">Your Branches</h2>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-primary hover:text-primary/80 font-semibold"
          >
            <Link href="/discover">
              Discover More
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Suspense fallback={<CategoryTabsSkeleton />}>
          <CategoryTabsWrapper selectedSlug={categorySlug} />
        </Suspense>

        <Suspense fallback={<BranchesListSkeleton />}>
          <BranchesList categorySlug={categorySlug} />
        </Suspense>
      </section>

      {/* Mobile FAB for new branch */}
      <div className="fixed bottom-6 right-6 sm:hidden z-50">
        <Button
          asChild
          size="lg"
          className="rounded-full shadow-xl h-14 w-14 p-0 btn-tropical glow-coral"
        >
          <Link href="/groups/new">
            <Plus className="h-6 w-6" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function AlertsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-24 mb-2" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}
