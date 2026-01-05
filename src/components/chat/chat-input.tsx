"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessageWithUser } from "@/types/database";

interface ChatInputProps {
  onSend: (content: string, replyToId?: string) => Promise<void>;
  replyTo?: ChatMessageWithUser | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  replyTo,
  onCancelReply,
  disabled = false,
}: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when reply is set
  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyTo]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
    }
  }, [content]);

  const handleSubmit = () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isPending || disabled) return;

    startTransition(async () => {
      await onSend(trimmedContent, replyTo?.id);
      setContent("");
      onCancelReply?.();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = content.trim().length > 0 && !isPending && !disabled;

  return (
    <div className="border-t bg-background p-4">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              Replying to <span className="font-medium">{replyTo.users?.name}</span>
            </p>
            <p className="text-sm truncate">{replyTo.content}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isPending || disabled}
            className={cn(
              "min-h-[44px] max-h-[150px] resize-none rounded-2xl pr-12 py-3",
              "focus-visible:ring-1 focus-visible:ring-primary"
            )}
            rows={1}
          />
          <span
            className={cn(
              "absolute bottom-3 right-3 text-xs",
              content.length > 1800 ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {content.length > 0 && `${content.length}/2000`}
          </span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSend}
          size="icon"
          className={cn(
            "h-11 w-11 rounded-full flex-shrink-0 transition-all",
            canSend ? "bg-primary hover:bg-primary/90" : "bg-muted"
          )}
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Character limit warning */}
      {content.length > 1800 && (
        <p className="text-xs text-destructive mt-1">
          {2000 - content.length} characters remaining
        </p>
      )}
    </div>
  );
}
