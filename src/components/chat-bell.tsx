"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare } from "lucide-react";

interface ChatBellProps {
  userId: string;
}

interface GroupWithUnread {
  id: string;
  name: string;
  unreadCount: number;
}

export function ChatBell({ userId }: ChatBellProps) {
  const supabase = createClient();
  const [groups, setGroups] = useState<GroupWithUnread[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchUnreadCounts = async () => {
    // Get user's active memberships with group info
    const { data: membershipsRaw } = await supabase
      .from("group_members")
      .select(`
        group_id,
        groups:group_id (id, name)
      `)
      .eq("user_id", userId)
      .eq("status", "active");

    type MembershipData = {
      group_id: string;
      groups: { id: string; name: string } | null;
    };

    const memberships = membershipsRaw as MembershipData[] | null;

    if (!memberships || memberships.length === 0) {
      setGroups([]);
      setTotalUnread(0);
      return;
    }

    const groupIds = memberships.map((m) => m.group_id);

    // Get all read receipts for user
    const { data: readReceiptsRaw } = await supabase
      .from("chat_read_receipts")
      .select("group_id, last_read_at")
      .eq("user_id", userId)
      .in("group_id", groupIds);

    type ReadReceiptData = {
      group_id: string;
      last_read_at: string;
    };

    const readReceipts = readReceiptsRaw as ReadReceiptData[] | null;

    const readReceiptMap = new Map(
      (readReceipts || []).map((r) => [r.group_id, r.last_read_at])
    );

    // Get unread counts for each group
    const groupsWithUnread: GroupWithUnread[] = [];
    let total = 0;

    for (const membership of memberships) {
      const groupId = membership.group_id;
      const lastReadAt = readReceiptMap.get(groupId);
      const groupData = membership.groups as unknown as { id: string; name: string };

      let query = supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId)
        .neq("user_id", userId);

      if (lastReadAt) {
        query = query.gt("created_at", lastReadAt);
      }

      const { count } = await query;
      const unreadCount = count || 0;

      if (unreadCount > 0) {
        groupsWithUnread.push({
          id: groupId,
          name: groupData?.name || "Unknown Group",
          unreadCount,
        });
      }
      total += unreadCount;
    }

    // Sort by unread count (highest first)
    groupsWithUnread.sort((a, b) => b.unreadCount - a.unreadCount);

    setGroups(groupsWithUnread);
    setTotalUnread(total);
  };

  useEffect(() => {
    fetchUnreadCounts();

    // Subscribe to realtime chat messages for all groups the user is in
    const channel = supabase
      .channel("chat_messages_bell")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const newMessage = payload.new as { user_id: string; group_id: string };
          // Only update if it's not the user's own message
          if (newMessage.user_id !== userId) {
            // Refetch to get accurate counts
            fetchUnreadCounts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild suppressHydrationWarning>
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-semibold">Messages</span>
          {totalUnread > 0 && (
            <span className="text-xs text-muted-foreground">
              {totalUnread} unread
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        {groups.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No unread messages
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {groups.map((group) => (
              <DropdownMenuItem key={group.id} asChild>
                <Link
                  href={`/groups/${group.id}/chat`}
                  className="flex items-center justify-between py-3 cursor-pointer"
                >
                  <span className="font-medium text-sm truncate flex-1 mr-2">
                    {group.name}
                  </span>
                  <span className="flex-shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {group.unreadCount > 99 ? "99+" : group.unreadCount}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/home"
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground cursor-pointer justify-center"
          >
            View all groups
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
