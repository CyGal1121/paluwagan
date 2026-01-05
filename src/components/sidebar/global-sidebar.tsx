"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Plus,
  User,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Compass,
  Crown,
} from "lucide-react";
import { SidebarNav, SidebarSection, NavItem } from "./sidebar-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/categories/category-icon";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Branch {
  id: string;
  name: string;
  category?: {
    icon: string | null;
    name: string;
  } | null;
  role: string;
}

interface GlobalSidebarProps {
  branches?: Branch[];
  className?: string;
}

export function GlobalSidebar({ branches = [], className }: GlobalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const mainNavItems: NavItem[] = [
    {
      title: "Home",
      href: "/home",
      icon: Home,
    },
    {
      title: "Discover",
      href: "/discover",
      icon: Compass,
    },
    {
      title: "New Branch",
      href: "/groups/new",
      icon: Plus,
    },
  ];

  const accountNavItems: NavItem[] = [
    {
      title: "Profile",
      href: "/profile",
      icon: User,
    },
    {
      title: "Verification",
      href: "/profile/verify",
      icon: ShieldCheck,
    },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {/* Main Navigation */}
      <div className="flex-1 space-y-6 py-4 overflow-y-auto scrollbar-thin">
        <SidebarSection>
          <SidebarNav items={mainNavItems} />
        </SidebarSection>

        <div className="mx-4 h-px bg-border" />

        {/* My Branches */}
        {branches.length > 0 && (
          <SidebarSection title="My Branches">
            <div className="space-y-1.5">
              {branches.map((branch) => {
                const isActive = pathname.startsWith(`/groups/${branch.id}`);
                const isOrganizer = branch.role === "organizer";
                return (
                  <Link
                    key={branch.id}
                    href={`/groups/${branch.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isOrganizer
                        ? "text-foreground hover:bg-accent/10 bg-accent/5"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isActive
                          ? "bg-primary-foreground/20"
                          : isOrganizer
                          ? "bg-accent/20"
                          : "bg-muted"
                      )}
                    >
                      <CategoryIcon
                        icon={branch.category?.icon ?? null}
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isActive ? "text-primary-foreground" : isOrganizer ? "text-accent" : ""
                        )}
                      />
                    </div>
                    <span className="flex-1 truncate font-medium">{branch.name}</span>
                    {isOrganizer && (
                      <Crown
                        className={cn(
                          "h-3.5 w-3.5 flex-shrink-0",
                          isActive ? "text-primary-foreground/80" : "text-accent"
                        )}
                      />
                    )}
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5",
                        isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </SidebarSection>
        )}

        {branches.length === 0 && (
          <SidebarSection title="My Branches">
            <div className="px-3 py-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">No branches yet</p>
              <Button asChild size="sm" className="w-full rounded-xl">
                <Link href="/groups/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Branch
                </Link>
              </Button>
            </div>
          </SidebarSection>
        )}
      </div>

      {/* Bottom Section */}
      <div className="border-t border-border/50 py-4 bg-muted/30">
        <SidebarSection>
          <SidebarNav items={accountNavItems} />
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </SidebarSection>
      </div>
    </div>
  );
}
