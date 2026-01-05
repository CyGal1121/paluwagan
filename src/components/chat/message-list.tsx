"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessageWithUser } from "@/types/database";

interface MessageListProps {
  messages: ChatMessageWithUser[];
  currentUserId: string;
  isOrganizer: boolean;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onReply?: (message: ChatMessageWithUser) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  isOrganizer,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onReply,
  onDelete,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Scroll to bottom on new messages if already at bottom
  useEffect(() => {
    if (isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isAtBottom]);

  // Handle scroll position
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    setIsAtBottom(distanceFromBottom < 100);
    setShowScrollButton(distanceFromBottom > 300);

    // Load more when scrolled to top
    if (scrollTop < 100 && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No messages yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Be the first to start the conversation! Send a message to your group members.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
      >
        {/* Load more indicator */}
        {hasMore && (
          <div className="flex justify-center py-4">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Button variant="ghost" size="sm" onClick={onLoadMore}>
                Load older messages
              </Button>
            )}
          </div>
        )}

        {/* Messages grouped by date */}
        {groupedMessages.map(({ date, messages: dateMessages }) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center py-4">
              <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground font-medium">
                {formatDateHeader(date)}
              </div>
            </div>

            {/* Messages */}
            {dateMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwnMessage={message.user_id === currentUserId}
                isOrganizer={isOrganizer}
                onReply={onReply}
                onDelete={onDelete}
              />
            ))}
          </div>
        ))}

        {/* Bottom anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg",
            "animate-in fade-in zoom-in duration-200"
          )}
          onClick={scrollToBottom}
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

// Helper: Group messages by date
function groupMessagesByDate(messages: ChatMessageWithUser[]) {
  const groups: { date: string; messages: ChatMessageWithUser[] }[] = [];
  let currentDate = "";

  for (const message of messages) {
    const messageDate = new Date(message.created_at).toDateString();

    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groups.push({ date: messageDate, messages: [] });
    }

    groups[groups.length - 1].messages.push(message);
  }

  return groups;
}

// Helper: Format date header
function formatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }
}
