"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Reply, Bot } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import type { ChatMessageWithUser } from "@/types/database";

interface ChatMessageProps {
  message: ChatMessageWithUser;
  isOwnMessage: boolean;
  isOrganizer: boolean;
  onReply?: (message: ChatMessageWithUser) => void;
  onDelete?: (messageId: string) => void;
}

export function ChatMessage({
  message,
  isOwnMessage,
  isOrganizer,
  onReply,
  onDelete,
}: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false);

  const canDelete = isOwnMessage || isOrganizer;
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

  if (message.is_system_message) {
    return (
      <div className="flex justify-center py-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-xs text-muted-foreground">
          <Bot className="h-3 w-3" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-2 hover:bg-muted/30 transition-colors",
        isOwnMessage && "flex-row-reverse"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={message.users?.photo_url || ""} alt={message.users?.name || "User"} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {message.users?.name ? getInitials(message.users.name) : "?"}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div className={cn("flex flex-col max-w-[70%]", isOwnMessage && "items-end")}>
        {/* Header */}
        <div className={cn("flex items-center gap-2 mb-0.5", isOwnMessage && "flex-row-reverse")}>
          <span className="text-sm font-medium">
            {message.users?.name || "Unknown"}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Message bubble */}
        <div
          className={cn(
            "relative rounded-2xl px-4 py-2",
            isOwnMessage
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm"
          )}
        >
          {/* Reply preview */}
          {message.reply_to && (
            <div
              className={cn(
                "mb-2 pb-2 border-b text-xs opacity-70",
                isOwnMessage ? "border-primary-foreground/20" : "border-border"
              )}
            >
              <span className="font-medium">{message.reply_to.users?.name}</span>
              <p className="truncate">{message.reply_to.content}</p>
            </div>
          )}

          {/* Content */}
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Actions */}
        {showActions && (
          <div
            className={cn(
              "flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
              isOwnMessage && "flex-row-reverse"
            )}
          >
            {onReply && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onReply(message)}
              >
                <Reply className="h-3 w-3" />
              </Button>
            )}

            {canDelete && onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(message.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
