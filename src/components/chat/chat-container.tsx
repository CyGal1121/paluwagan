"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  sendMessage,
  getMessages,
  deleteMessage,
  markMessagesAsRead,
} from "@/lib/actions/chat";
import { toast } from "sonner";
import type { ChatMessageWithUser } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ChatContainerProps {
  groupId: string;
  currentUserId: string;
  isOrganizer: boolean;
}

export function ChatContainer({
  groupId,
  currentUserId,
  isOrganizer,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessageWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessageWithUser | null>(null);

  const supabase = createClient();

  // Load initial messages
  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    const result = await getMessages(groupId, 50);

    if (result.success && result.messages) {
      setMessages(result.messages);
      setHasMore(result.messages.length === 50);

      // Mark messages as read
      if (result.messages.length > 0) {
        const lastMessage = result.messages[result.messages.length - 1];
        markMessagesAsRead(groupId, lastMessage.id);
      }
    } else {
      toast.error(result.error || "Failed to load messages");
    }

    setIsLoading(false);
  }, [groupId]);

  // Load more messages (older)
  const loadMoreMessages = useCallback(async () => {
    if (messages.length === 0) return;

    const firstMessage = messages[0];
    const result = await getMessages(groupId, 50, firstMessage.id);

    if (result.success && result.messages) {
      setMessages((prev) => [...result.messages!, ...prev]);
      setHasMore(result.messages.length === 50);
    }
  }, [groupId, messages]);

  // Send message handler
  const handleSendMessage = async (content: string, replyToId?: string) => {
    const result = await sendMessage(groupId, content, replyToId);

    if (!result.success) {
      toast.error(result.error || "Failed to send message");
      return;
    }

    // Message will be added via real-time subscription
  };

  // Delete message handler
  const handleDeleteMessage = async (messageId: string) => {
    const result = await deleteMessage(messageId, groupId);

    if (!result.success) {
      toast.error(result.error || "Failed to delete message");
      return;
    }

    // Remove from local state immediately
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    toast.success("Message deleted");
  };

  // Reply handler
  const handleReply = (message: ChatMessageWithUser) => {
    setReplyTo(message);
  };

  // Set up real-time subscription
  useEffect(() => {
    loadMessages();

    let channel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      channel = supabase
        .channel(`chat:${groupId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `group_id=eq.${groupId}`,
          },
          async (payload) => {
            // Fetch the full message with user data
            const { data: newMessage } = await supabase
              .from("chat_messages")
              .select(`
                *,
                users:user_id (id, name, photo_url)
              `)
              .eq("id", payload.new.id)
              .single();

            if (newMessage) {
              setMessages((prev) => {
                // Avoid duplicates
                if (prev.some((m) => m.id === newMessage.id)) {
                  return prev;
                }
                return [...prev, newMessage as unknown as ChatMessageWithUser];
              });

              // Mark as read if from another user
              if (payload.new.user_id !== currentUserId) {
                markMessagesAsRead(groupId, payload.new.id);
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "chat_messages",
            filter: `group_id=eq.${groupId}`,
          },
          (payload) => {
            setMessages((prev) =>
              prev.filter((m) => m.id !== payload.old.id)
            );
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [groupId, currentUserId, loadMessages, supabase]);

  if (isLoading && messages.length === 0) {
    return <ChatLoadingSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        isOrganizer={isOrganizer}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
        onReply={handleReply}
        onDelete={handleDeleteMessage}
      />
      <ChatInput
        onSend={handleSendMessage}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}

function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`flex gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}
          >
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className={`space-y-1 ${i % 2 === 0 ? "" : "items-end"}`}>
              <Skeleton className="h-3 w-20" />
              <Skeleton
                className={`h-16 rounded-2xl ${
                  i % 2 === 0 ? "w-48" : "w-64"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <Skeleton className="h-11 rounded-2xl" />
      </div>
    </div>
  );
}
