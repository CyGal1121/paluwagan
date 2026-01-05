"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ChatMessageWithUser } from "@/types/database";

interface SendMessageResult {
  success: boolean;
  message?: ChatMessageWithUser;
  error?: string;
}

interface GetMessagesResult {
  success: boolean;
  messages?: ChatMessageWithUser[];
  error?: string;
}

// Send a new message to a group chat
export async function sendMessage(
  groupId: string,
  content: string,
  replyToId?: string
): Promise<SendMessageResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate content
  const trimmedContent = content.trim();
  if (!trimmedContent || trimmedContent.length > 2000) {
    return { success: false, error: "Message must be between 1 and 2000 characters" };
  }

  // Check if user is a member of the group
  const { data: membership } = await supabase
    .from("group_members")
    .select("status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.status !== "active") {
    return { success: false, error: "You are not an active member of this group" };
  }

  // Insert the message
  const { data: message, error } = await supabase
    .from("chat_messages")
    .insert({
      group_id: groupId,
      user_id: user.id,
      content: trimmedContent,
      reply_to_id: replyToId || null,
    })
    .select(`
      *,
      users:user_id (id, name, photo_url)
    `)
    .single();

  if (error) {
    console.error("Error sending message:", error);
    return { success: false, error: "Failed to send message" };
  }

  revalidatePath(`/groups/${groupId}/chat`);

  return {
    success: true,
    message: message as unknown as ChatMessageWithUser,
  };
}

// Get messages for a group (paginated)
export async function getMessages(
  groupId: string,
  limit: number = 50,
  beforeId?: string
): Promise<GetMessagesResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Build query
  let query = supabase
    .from("chat_messages")
    .select(`
      *,
      users:user_id (id, name, photo_url)
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  // If loading older messages, filter by beforeId
  if (beforeId) {
    const { data: beforeMessage } = await supabase
      .from("chat_messages")
      .select("created_at")
      .eq("id", beforeId)
      .single();

    if (beforeMessage) {
      query = query.lt("created_at", beforeMessage.created_at);
    }
  }

  const { data: messages, error } = await query;

  if (error) {
    console.error("Error fetching messages:", error);
    return { success: false, error: "Failed to fetch messages" };
  }

  // Reverse to get chronological order
  const orderedMessages = (messages || []).reverse();

  return {
    success: true,
    messages: orderedMessages as unknown as ChatMessageWithUser[],
  };
}

// Delete a message (own message or organizer can delete any)
export async function deleteMessage(
  messageId: string,
  groupId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get the message
  const { data: message } = await supabase
    .from("chat_messages")
    .select("user_id")
    .eq("id", messageId)
    .single();

  if (!message) {
    return { success: false, error: "Message not found" };
  }

  // Check if user is the author or an organizer
  const isAuthor = message.user_id === user.id;

  if (!isAuthor) {
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "organizer") {
      return { success: false, error: "You can only delete your own messages" };
    }
  }

  // Delete the message
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("id", messageId);

  if (error) {
    console.error("Error deleting message:", error);
    return { success: false, error: "Failed to delete message" };
  }

  revalidatePath(`/groups/${groupId}/chat`);

  return { success: true };
}

// Mark messages as read
export async function markMessagesAsRead(
  groupId: string,
  lastMessageId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Upsert read receipt
  const { error } = await supabase
    .from("chat_read_receipts")
    .upsert(
      {
        group_id: groupId,
        user_id: user.id,
        last_read_message_id: lastMessageId,
        last_read_at: new Date().toISOString(),
      },
      {
        onConflict: "group_id,user_id",
      }
    );

  if (error) {
    console.error("Error marking messages as read:", error);
    return { success: false, error: "Failed to update read status" };
  }

  return { success: true };
}

// Get unread message count for a group
export async function getUnreadCount(
  groupId: string
): Promise<{ count: number; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { count: 0, error: "Not authenticated" };
  }

  // Get last read message
  const { data: readReceipt } = await supabase
    .from("chat_read_receipts")
    .select("last_read_at")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  // Count messages after last read
  let query = supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .neq("user_id", user.id); // Don't count own messages

  if (readReceipt?.last_read_at) {
    query = query.gt("created_at", readReceipt.last_read_at);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error getting unread count:", error);
    return { count: 0, error: "Failed to get unread count" };
  }

  return { count: count || 0 };
}

// Get unread counts for all user's groups
export async function getAllUnreadCounts(): Promise<{
  counts: Record<string, number>;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { counts: {}, error: "Not authenticated" };
  }

  // Get user's active memberships
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    return { counts: {} };
  }

  const groupIds = memberships.map((m) => m.group_id);

  // Get all read receipts for user
  const { data: readReceipts } = await supabase
    .from("chat_read_receipts")
    .select("group_id, last_read_at")
    .eq("user_id", user.id)
    .in("group_id", groupIds);

  const readReceiptMap = new Map(
    (readReceipts || []).map((r) => [r.group_id, r.last_read_at])
  );

  // Get unread counts for each group
  const counts: Record<string, number> = {};

  for (const groupId of groupIds) {
    const lastReadAt = readReceiptMap.get(groupId);

    let query = supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .neq("user_id", user.id);

    if (lastReadAt) {
      query = query.gt("created_at", lastReadAt);
    }

    const { count } = await query;
    counts[groupId] = count || 0;
  }

  return { counts };
}
