"use server";

import { createClient } from "@/lib/supabase/server";

type NotificationType =
  | "member_joined"
  | "member_approved"
  | "member_removed"
  | "contribution_received"
  | "contribution_confirmed"
  | "contribution_disputed"
  | "payout_scheduled"
  | "payout_sent"
  | "payout_confirmed"
  | "cycle_started"
  | "cycle_closing"
  | "branch_started"
  | "new_chat_message";

interface CreateNotificationParams {
  userId: string;
  groupId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// Create a single notification
export async function createNotification({
  userId,
  groupId,
  type,
  title,
  message,
  data = {},
}: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    group_id: groupId || null,
    type,
    title,
    message,
    data_json: data,
  });

  if (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Create notifications for multiple users
export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const notifications = userIds.map((userId) => ({
    user_id: userId,
    group_id: params.groupId || null,
    type: params.type,
    title: params.title,
    message: params.message,
    data_json: params.data || {},
  }));

  const { error } = await supabase.from("notifications").insert(notifications);

  if (error) {
    console.error("Error creating bulk notifications:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Notify all members of a group (except specified user)
export async function notifyGroupMembers(
  groupId: string,
  excludeUserId: string,
  params: Omit<CreateNotificationParams, "userId" | "groupId">
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get all active members of the group
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("status", "active")
    .neq("user_id", excludeUserId);

  if (membersError) {
    console.error("Error fetching group members:", membersError);
    return { success: false, error: membersError.message };
  }

  if (!members || members.length === 0) {
    return { success: true }; // No one to notify
  }

  const userIds = members.map((m) => m.user_id);
  return createBulkNotifications(userIds, { ...params, groupId });
}

// Get unread notification count for a user
export async function getUnreadCount(
  userId: string
): Promise<{ count: number; error?: string }> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("Error getting unread count:", error);
    return { count: 0, error: error.message };
  }

  return { count: count || 0 };
}

// Mark notification as read
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Delete old notifications (cleanup)
export async function deleteOldNotifications(
  daysOld: number = 30
): Promise<{ success: boolean; deleted?: number; error?: string }> {
  const supabase = await createClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .lt("created_at", cutoffDate.toISOString())
    .select("id");

  if (error) {
    console.error("Error deleting old notifications:", error);
    return { success: false, error: error.message };
  }

  return { success: true, deleted: data?.length || 0 };
}

// Helper: Create notification when member joins a group
export async function notifyMemberJoined(
  groupId: string,
  groupName: string,
  memberName: string,
  memberUserId: string
) {
  return notifyGroupMembers(groupId, memberUserId, {
    type: "member_joined",
    title: "New Member Joined",
    message: `${memberName} has requested to join ${groupName}`,
    data: { groupId, memberName },
  });
}

// Helper: Create notification when member is approved
export async function notifyMemberApproved(
  userId: string,
  groupId: string,
  groupName: string
) {
  return createNotification({
    userId,
    groupId,
    type: "member_approved",
    title: "Welcome to the Group!",
    message: `You have been approved to join ${groupName}`,
    data: { groupId, groupName },
  });
}

// Helper: Create notification when contribution is confirmed
export async function notifyContributionConfirmed(
  userId: string,
  groupId: string,
  groupName: string,
  amount: number
) {
  return createNotification({
    userId,
    groupId,
    type: "contribution_confirmed",
    title: "Payment Confirmed",
    message: `Your ₱${amount.toLocaleString()} contribution to ${groupName} has been confirmed`,
    data: { groupId, amount },
  });
}

// Helper: Create notification when payout is sent
export async function notifyPayoutSent(
  userId: string,
  groupId: string,
  groupName: string,
  amount: number
) {
  return createNotification({
    userId,
    groupId,
    type: "payout_sent",
    title: "Payout Sent!",
    message: `Your ₱${amount.toLocaleString()} payout from ${groupName} has been sent`,
    data: { groupId, amount },
  });
}

// Helper: Create notification for new chat message
export async function notifyNewChatMessage(
  groupId: string,
  groupName: string,
  senderName: string,
  senderUserId: string,
  messagePreview: string
) {
  return notifyGroupMembers(groupId, senderUserId, {
    type: "new_chat_message",
    title: `New message in ${groupName}`,
    message: `${senderName}: ${messagePreview.slice(0, 50)}${messagePreview.length > 50 ? "..." : ""}`,
    data: { groupId, senderName },
  });
}
