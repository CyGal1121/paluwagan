"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";
import type { ActionResult } from "./group";

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data || [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Error fetching category:", error);
    return null;
  }

  return data;
}

export async function createCustomCategory(
  name: string,
  description?: string,
  icon?: string
): Promise<ActionResult<Category>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Create slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check if slug already exists
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    return { success: false, error: "A category with this name already exists" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("categories")
    .insert({
      name,
      slug,
      description: description || null,
      icon: icon || null,
      is_custom: true,
      created_by: user.id,
      sort_order: 100, // Custom categories at the end
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "Failed to create category" };
  }

  revalidatePath("/home");
  return { success: true, data };
}

export async function getBranchesByCategory(
  categorySlug?: string
): Promise<{
  category: Category | null;
  branches: Array<{
    id: string;
    name: string;
    contribution_amount: number;
    frequency: string;
    status: string;
    members_limit: number;
    member_count: number;
    role: string;
    membership_status: string;
  }>;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { category: null, branches: [] };
  }

  // Get category if slug provided
  let category: Category | null = null;
  if (categorySlug) {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .single();
    category = data as Category | null;
  }

  // Get user's branches
  let query = supabase
    .from("group_members")
    .select(
      `
      role,
      status,
      groups (
        id,
        name,
        contribution_amount,
        frequency,
        status,
        members_limit,
        category_id
      )
    `
    )
    .eq("user_id", user.id)
    .in("status", ["active", "pending"]);

  const { data: membershipsRaw } = await query;

  type MembershipData = {
    role: string;
    status: string;
    groups: {
      id: string;
      name: string;
      contribution_amount: number;
      frequency: string;
      status: string;
      members_limit: number;
      category_id: string | null;
    } | null;
  };

  const memberships = membershipsRaw as MembershipData[] | null;

  if (!memberships) {
    return { category, branches: [] };
  }

  // Filter by category if provided
  let filteredMemberships = memberships;
  if (category) {
    filteredMemberships = memberships.filter((m) => {
      return m.groups?.category_id === category.id;
    });
  }

  // Get member counts for each group
  const branches = await Promise.all(
    filteredMemberships.map(async (membership) => {
      const group = membership.groups as {
        id: string;
        name: string;
        contribution_amount: number;
        frequency: string;
        status: string;
        members_limit: number;
      };

      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id)
        .in("status", ["active", "pending"]);

      return {
        ...group,
        member_count: count || 0,
        role: membership.role,
        membership_status: membership.status,
      };
    })
  );

  return { category, branches };
}

export async function getCategoriesWithBranchCounts(): Promise<
  Array<Category & { branch_count: number }>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get all active categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!categories) {
    return [];
  }

  // Get user's memberships
  const { data: membershipsRaw } = await supabase
    .from("group_members")
    .select(
      `
      groups (
        category_id
      )
    `
    )
    .eq("user_id", user.id)
    .in("status", ["active", "pending"]);

  type MembershipWithGroup = {
    groups: { category_id: string | null } | null;
  };

  const memberships = membershipsRaw as MembershipWithGroup[] | null;
  const typedCategories = categories as Category[];

  // Count branches per category
  const categoryCounts: Record<string, number> = {};
  memberships?.forEach((m) => {
    if (m.groups?.category_id) {
      categoryCounts[m.groups.category_id] = (categoryCounts[m.groups.category_id] || 0) + 1;
    }
  });

  return typedCategories.map((cat) => ({
    ...cat,
    branch_count: categoryCounts[cat.id] || 0,
  }));
}
