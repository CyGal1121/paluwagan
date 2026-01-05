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
import { ThemeToggle } from "@/components/theme-toggle";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { Logo } from "@/components/ui/logo";

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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/* Sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle sidebar"
            className="rounded-xl hover:bg-primary/10"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/home">
            <Logo size="md" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell userId={user.id} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild suppressHydrationWarning>
              <Button variant="ghost" size="icon" className="rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all">
                <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                  <AvatarImage src={user.photo_url || ""} alt={user.name || "User"} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {user.name ? getInitials(user.name) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
              <div className="px-3 py-2.5 bg-muted rounded-lg mb-1">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">Manage your account</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                <Link href="/home" className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-primary" />
                  Home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                <Link href="/groups/new" className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  Create Branch
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                <Link href="/profile/verify" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Verification
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive rounded-lg cursor-pointer focus:text-destructive"
              >
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
