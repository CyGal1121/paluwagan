"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  Calendar,
  Users,
  BookOpen,
  MessageSquare,
  Receipt,
  ScrollText,
  Settings,
  UserPlus,
} from "lucide-react";
import { SidebarNav, SidebarSection, NavItem } from "./sidebar-nav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/categories/category-icon";

interface BranchSidebarProps {
  groupId: string;
  groupName: string;
  groupStatus: string;
  isOrganizer: boolean;
  category?: {
    icon: string | null;
    name: string;
  } | null;
  pendingCount?: number;
  className?: string;
}

export function BranchSidebar({
  groupId,
  groupName,
  groupStatus,
  isOrganizer,
  category,
  pendingCount = 0,
  className,
}: BranchSidebarProps) {
  const pathname = usePathname();

  const branchNavItems: NavItem[] = [
    {
      title: "Overview",
      href: `/groups/${groupId}`,
      icon: LayoutDashboard,
    },
    {
      title: "Schedule",
      href: `/groups/${groupId}/calendar`,
      icon: Calendar,
    },
    {
      title: "Members",
      href: `/groups/${groupId}/members`,
      icon: Users,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      title: "Ledger",
      href: `/groups/${groupId}/ledger`,
      icon: BookOpen,
    },
    {
      title: "Chat",
      href: `/groups/${groupId}/chat`,
      icon: MessageSquare,
    },
    {
      title: "Activity Log",
      href: `/groups/${groupId}/audit`,
      icon: ScrollText,
    },
  ];

  // Add organizer-only items (insert before Chat)
  if (isOrganizer) {
    branchNavItems.splice(5, 0, {
      title: "Branch Fees",
      href: `/groups/${groupId}/fees`,
      icon: Receipt,
    });
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Back to Home */}
      <div className="py-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/home">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <Separator className="mx-3" />

      {/* Branch Header */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-2">
          <CategoryIcon icon={category?.icon} className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{groupName}</h3>
            <div className="flex items-center gap-2">
              {category && (
                <span className="text-xs text-muted-foreground">{category.name}</span>
              )}
              <Badge
                variant={
                  groupStatus === "active"
                    ? "default"
                    : groupStatus === "forming"
                      ? "secondary"
                      : "outline"
                }
                className="text-[10px]"
              >
                {groupStatus}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Separator className="mx-3" />

      {/* Branch Navigation */}
      <div className="flex-1 py-4">
        <SidebarSection>
          <SidebarNav items={branchNavItems} />
        </SidebarSection>
      </div>

      {/* Organizer Actions */}
      {isOrganizer && (
        <div className="border-t py-4">
          <SidebarSection title="Organizer">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              >
                <Link href={`/groups/${groupId}?invite=true`}>
                  <UserPlus className="h-4 w-4" />
                  Invite Members
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              >
                <Link href={`/groups/${groupId}/settings`}>
                  <Settings className="h-4 w-4" />
                  Branch Settings
                </Link>
              </Button>
            </div>
          </SidebarSection>
        </div>
      )}
    </div>
  );
}
