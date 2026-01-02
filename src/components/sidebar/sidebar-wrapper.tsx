"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";
import { cn } from "@/lib/utils";

interface Branch {
  id: string;
  name: string;
  status: string;
  category?: {
    icon: string | null;
    name: string;
  } | null;
  role: string;
  pendingCount?: number;
}

interface SidebarLayoutProps {
  branches: Branch[];
  header: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarLayout({ branches, header, children }: SidebarLayoutProps) {
  const pathname = usePathname();


  // Find current branch if we're in a branch context
  const groupMatch = pathname.match(/^\/groups\/([^\/]+)/);
  const groupId = groupMatch ? groupMatch[1] : null;
  const currentBranch = groupId && groupId !== "new"
    ? branches.find(b => b.id === groupId)
    : null;
  const isOrganizer = currentBranch?.role === "organizer";

  return (
    <SidebarProvider>
      <div className="min-h-dvh flex flex-col bg-background">
        {header}
        <div className="flex flex-1">
          <Sidebar
            branches={branches}
            currentBranch={currentBranch}
            isOrganizer={isOrganizer}
          />
          <main className={cn(
            "flex-1 transition-all duration-300",
            "lg:ml-64" // Offset for sidebar on desktop
          )}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
