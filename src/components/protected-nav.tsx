"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { Bell, Home, LogOut, Plus, Settings, User } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { NotificationBell } from "@/components/notification-bell";

interface ProtectedNavProps {
  user: {
    id: string;
    name: string | null;
    photo_url: string | null;
  };
}

export function ProtectedNav({ user }: ProtectedNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/home" className="flex items-center space-x-2">
          <span className="text-lg font-bold text-primary">Paluwagan</span>
        </Link>

        <div className="flex items-center gap-2">
          <NotificationBell userId={user.id} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
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
                  Create Group
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
