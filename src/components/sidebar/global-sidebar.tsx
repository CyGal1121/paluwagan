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
} from "lucide-react";
import { SidebarNav, SidebarSection, NavItem } from "./sidebar-nav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
    <div className={cn("flex h-full flex-col", className)}>
      {/* Main Navigation */}
      <div className="flex-1 space-y-4 py-4">
        <SidebarSection>
          <SidebarNav items={mainNavItems} />
        </SidebarSection>

        <Separator className="mx-3" />

        {/* My Branches */}
        {branches.length > 0 && (
          <SidebarSection title="My Branches">
            <div className="space-y-1">
              {branches.map((branch) => {
                const isActive = pathname.startsWith(`/groups/${branch.id}`);
                return (
                  <Link
                    key={branch.id}
                    href={`/groups/${branch.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <CategoryIcon
                      icon={branch.category?.icon}
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive ? "text-primary-foreground" : ""
                      )}
                    />
                    <span className="flex-1 truncate">{branch.name}</span>
                    {branch.role === "organizer" && (
                      <span
                        className={cn(
                          "text-[10px] font-medium uppercase",
                          isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                      >
                        Org
                      </span>
                    )}
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
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
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground">No branches yet</p>
              <Button asChild size="sm" className="mt-2 w-full">
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
      <div className="border-t py-4">
        <SidebarSection>
          <SidebarNav items={accountNavItems} />
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-muted-foreground hover:bg-muted hover:text-foreground"
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
