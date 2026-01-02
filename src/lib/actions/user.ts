"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./group";

export async function uploadIdPhoto(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file size (max 5MB for ID photos)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File must be less than 5MB" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Only JPEG, PNG, or WebP images are allowed" };
  }

  const fileExt = file.name.split(".").pop();
  const filePath = `id-photos/${user.id}.${fileExt}`;

  // Upload to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from("proofs")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { success: false, error: "Failed to upload ID photo" };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("proofs").getPublicUrl(filePath);

  // Update user record
  const { error: updateError } = await supabase
    .from("users")
    .update({
      id_photo_url: publicUrl,
      id_verification_status: "pending",
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Update error:", updateError);
    return { success: false, error: "Failed to update profile" };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/verify");
  return { success: true, data: { url: publicUrl } };
}

export async function uploadProfilePhoto(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file size (max 2MB for profile photos)
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "File must be less than 2MB" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Only JPEG, PNG, or WebP images are allowed" };
  }

  const fileExt = file.name.split(".").pop();
  const filePath = `avatars/${user.id}.${fileExt}`;

  // Upload to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from("proofs")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { success: false, error: "Failed to upload photo" };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("proofs").getPublicUrl(filePath);

  // Update user record
  const { error: updateError } = await supabase
    .from("users")
    .update({ photo_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    console.error("Update error:", updateError);
    return { success: false, error: "Failed to update profile" };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/verify");
  return { success: true, data: { url: publicUrl } };
}

export async function submitForVerification(): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get current user data
  const { data: userData } = await supabase
    .from("users")
    .select("photo_url, id_photo_url, id_verification_status")
    .eq("id", user.id)
    .single();

  if (!userData) {
    return { success: false, error: "User not found" };
  }

  // Check if both photos are uploaded
  if (!userData.photo_url) {
    return { success: false, error: "Please upload a profile photo first" };
  }

  if (!userData.id_photo_url) {
    return { success: false, error: "Please upload an ID photo first" };
  }

  // Update status to pending if not already
  if (userData.id_verification_status !== "pending") {
    const { error } = await supabase
      .from("users")
      .update({ id_verification_status: "pending" })
      .eq("id", user.id);

    if (error) {
      console.error("Update error:", error);
      return { success: false, error: "Failed to submit for verification" };
    }
  }

  revalidatePath("/profile");
  revalidatePath("/profile/verify");
  return { success: true };
}

export async function getUserVerificationStatus(): Promise<{
  photoUrl: string | null;
  idPhotoUrl: string | null;
  status: "none" | "pending" | "verified" | "rejected";
  rejectionReason: string | null;
  isVerified: boolean;
  canCreateBranch: boolean;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      photoUrl: null,
      idPhotoUrl: null,
      status: "none",
      rejectionReason: null,
      isVerified: false,
      canCreateBranch: false,
    };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("photo_url, id_photo_url, id_verification_status, id_rejection_reason")
    .eq("id", user.id)
    .single();

  if (!userData) {
    return {
      photoUrl: null,
      idPhotoUrl: null,
      status: "none",
      rejectionReason: null,
      isVerified: false,
      canCreateBranch: false,
    };
  }

  const isVerified =
    userData.photo_url !== null &&
    userData.id_photo_url !== null &&
    userData.id_verification_status === "verified";

  return {
    photoUrl: userData.photo_url,
    idPhotoUrl: userData.id_photo_url,
    status: (userData.id_verification_status as "none" | "pending" | "verified" | "rejected") || "none",
    rejectionReason: userData.id_rejection_reason,
    isVerified,
    canCreateBranch: isVerified,
  };
}

// Admin/Organizer function to verify a user
export async function verifyUser(
  userId: string,
  approve: boolean,
  rejectionReason?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // For now, any authenticated user can verify (in production, add role check)
  // In future: check if user is an organizer or admin

  const updateData: Record<string, unknown> = {
    id_verification_status: approve ? "verified" : "rejected",
    id_verified_at: approve ? new Date().toISOString() : null,
    id_verified_by: approve ? user.id : null,
    id_rejection_reason: approve ? null : rejectionReason || "Verification rejected",
  };

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId);

  if (error) {
    console.error("Verification error:", error);
    return { success: false, error: "Failed to update verification status" };
  }

  // Create notification for the user
  await supabase.from("notifications").insert({
    user_id: userId,
    type: approve ? "verification_approved" : "verification_rejected",
    title: approve ? "Verification Approved" : "Verification Rejected",
    message: approve
      ? "Your ID has been verified. You can now create and join branches."
      : `Your verification was rejected: ${rejectionReason || "Please re-upload your ID photo."}`,
    data_json: {},
  });

  revalidatePath("/profile");
  return { success: true };
}
