"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
  external?: boolean;
}

interface SidebarNavProps {
  items: NavItem[];
  className?: string;
}

export function SidebarNav({ items, className }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {items.map((item) => {
        // Check if this is a base group route (e.g., /groups/{id}) vs a sub-route
        const isGroupBase = /^\/groups\/[^/]+$/.test(item.href);
        // For base routes, only match exactly. For sub-routes, match with startsWith
        const isActive = isGroupBase
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.disabled ? "#" : item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              item.disabled && "pointer-events-none opacity-50"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate">{item.title}</span>
            {item.badge && (
              <span
                className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted-foreground/20 text-muted-foreground"
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function SidebarSection({ title, children, className }: SidebarSectionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}
