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
  TrendingUp,
  Wallet,
  Calendar,
  Sparkles,
  Smartphone,
  Tv,
  ArrowRight,
  Gift,
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
    .single();

  const firstName = userData?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{greeting},</p>
      <h1 className="text-2xl sm:text-3xl font-bold">{firstName}!</h1>
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
    .eq("status", "active");

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

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeBranches}</p>
              <p className="text-xs text-muted-foreground">Active Branches</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/10">
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{organizerCount}</p>
              <p className="text-xs text-muted-foreground">As Organizer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 col-span-2 lg:col-span-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-500/10">
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
              <p className="text-xs text-muted-foreground">Monthly Contribution</p>
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
    .single();

  if (!userData) return null;

  const status = userData.id_verification_status || "none";

  // Don't show banner if verified
  if (status === "verified") return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 overflow-hidden">
      <CardContent className="flex items-center justify-between py-4 relative">
        <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-3 relative">
          <div className="bg-primary/10 rounded-full p-2.5">
            <ShieldCheck className="h-5 w-5 text-primary" />
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
        <Button size="sm" className="relative z-10" asChild>
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
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Content */}
          <div className="flex-1 p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white hover:bg-white/30 border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                New Service
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-bold">
                Pautang Appliances & Gadgets
              </h3>
              <p className="text-white/80 text-sm md:text-base">
                Get the appliances and gadgets you need now, pay monthly at affordable rates.
                No credit card required!
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-full bg-white/20">
                  <Smartphone className="h-3.5 w-3.5" />
                </div>
                <span>Smartphones</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-full bg-white/20">
                  <Tv className="h-3.5 w-3.5" />
                </div>
                <span>Appliances</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-full bg-white/20">
                  <Gift className="h-3.5 w-3.5" />
                </div>
                <span>Easy Terms</span>
              </div>
            </div>
            <Button
              asChild
              className="bg-white text-purple-700 hover:bg-white/90 shadow-md mt-2"
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
            <div className="relative grid grid-cols-2 gap-3 opacity-90">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-white/80" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center translate-y-4">
                <Tv className="h-8 w-8 text-white/80" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center -translate-y-2">
                <Wallet className="h-8 w-8 text-white/80" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center translate-y-2">
                <Calendar className="h-8 w-8 text-white/80" />
              </div>
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
  const { data: memberships } = await supabase
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

  if (!memberships || memberships.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No branches yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            Start your savings journey by creating a new branch or joining one using an
            invite link from a friend.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/groups/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Branch
              </Link>
            </Button>
            <Button variant="outline" asChild>
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
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No branches in this category</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create a new branch in this category to get started.
          </p>
          <Button asChild>
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
      {filteredMemberships.map((membership) => {
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
              className={`hover:shadow-lg transition-all cursor-pointer h-full group ${
                isOrganizer ? "border-amber-500/30 bg-amber-50/30" : ""
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {group.categories && (
                      <div
                        className={`p-2 rounded-lg ${
                          isOrganizer ? "bg-amber-100" : "bg-primary/10"
                        }`}
                      >
                        <CategoryIcon
                          icon={group.categories.icon}
                          className={`h-4 w-4 ${
                            isOrganizer ? "text-amber-600" : "text-primary"
                          }`}
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
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(group.contribution_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {group.frequency}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isOrganizer && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
                        Organizer
                      </Badge>
                    )}
                    {isPending && (
                      <Badge variant="warning" className="text-xs">
                        Pending
                      </Badge>
                    )}
                    {!isOrganizer && !isPending && (
                      <Badge variant="secondary" className="text-xs">
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
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-5" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
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
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Card className="col-span-2 lg:col-span-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryTabsSkeleton() {
  return (
    <div className="flex gap-1 p-1 bg-muted/50 rounded-lg overflow-x-auto">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-8 w-20 flex-shrink-0" />
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
    <div className="py-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-start justify-between gap-4">
        <Suspense fallback={<Skeleton className="h-14 w-48" />}>
          <WelcomeHeader />
        </Suspense>
        <Button asChild className="hidden sm:flex">
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
          <h2 className="text-lg font-semibold">Your Branches</h2>
          <Button variant="ghost" size="sm" asChild className="text-primary">
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
        <Button asChild size="lg" className="rounded-full shadow-lg h-14 w-14 p-0">
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
    <div className="space-y-2">
      <Skeleton className="h-5 w-24 mb-2" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}
