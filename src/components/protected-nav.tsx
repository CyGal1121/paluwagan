"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, LogOut, Menu, Plus, ShieldCheck, User } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { NotificationBell } from "@/components/notification-bell";
import { useSidebar } from "@/components/sidebar/sidebar-context";

interface ProtectedNavProps {
  user: {
    id: string;
    name: string | null;
    photo_url: string | null;
  };
}

export function ProtectedNav({ user }: ProtectedNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const { toggle, isMobile } = useSidebar();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {/* Mobile sidebar toggle */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link href="/home" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Pinoy Paluwagan" className="h-8 w-8" />
            <span className="text-lg font-bold text-primary hidden sm:inline">Paluwagan</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell userId={user.id} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild suppressHydrationWarning>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photo_url || ""} alt={user.name || "User"} />
                  <AvatarFallback className="text-xs">
                    {user.name ? getInitials(user.name) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/home">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/groups/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Branch
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/verify">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Verification
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
