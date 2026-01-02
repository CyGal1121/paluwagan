"use client";

import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-context";
import { GlobalSidebar } from "./global-sidebar";
import { BranchSidebar } from "./branch-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

interface SidebarProps {
  branches: Branch[];
  currentBranch?: Branch | null;
  isOrganizer?: boolean;
}

export function Sidebar({ branches, currentBranch, isOrganizer = false }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, isMobile, close } = useSidebar();

  // Determine if we're inside a branch context
  const groupMatch = pathname.match(/^\/groups\/([^\/]+)/);
  const groupId = groupMatch ? groupMatch[1] : null;
  const isInBranch = !!groupId && groupId !== "new";

  const sidebarContent = isInBranch && currentBranch ? (
    <BranchSidebar
      groupId={currentBranch.id}
      groupName={currentBranch.name}
      groupStatus={currentBranch.status}
      isOrganizer={isOrganizer}
      category={currentBranch.category}
      pendingCount={currentBranch.pendingCount}
    />
  ) : (
    <GlobalSidebar branches={branches} />
  );

  // Mobile: Use Sheet (drawer)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SheetContent side="left" className="w-72 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <aside
      className={cn(
        "fixed left-0 top-14 z-40 h-[calc(100dvh-3.5rem)] w-64 border-r bg-background transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {sidebarContent}
    </aside>
  );
}
