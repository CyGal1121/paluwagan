"use server";

import { createClient } from "@/lib/supabase/server";
import type { Region, Province, City, Barangay, DiscoverableBranch } from "@/types/database";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Get all regions
export async function getRegions(): Promise<Region[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("regions")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching regions:", error);
    return [];
  }

  return data || [];
}

// Get provinces by region
export async function getProvinces(regionId: string): Promise<Province[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("provinces")
    .select("*")
    .eq("region_id", regionId)
    .order("name");

  if (error) {
    console.error("Error fetching provinces:", error);
    return [];
  }

  return data || [];
}

// Get cities by province
export async function getCities(provinceId: string): Promise<City[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("province_id", provinceId)
    .order("name");

  if (error) {
    console.error("Error fetching cities:", error);
    return [];
  }

  return data || [];
}

// Get barangays by city
export async function getBarangays(cityId: string): Promise<Barangay[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("barangays")
    .select("*")
    .eq("city_id", cityId)
    .order("name");

  if (error) {
    console.error("Error fetching barangays:", error);
    return [];
  }

  return data || [];
}

// Search for discoverable branches by location
export interface SearchBranchesParams {
  cityId?: string;
  barangayId?: string;
  regionId?: string;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface SearchBranchesResult {
  branches: DiscoverableBranch[];
  total: number;
  hasMore: boolean;
}

export async function searchDiscoverableBranches(
  params: SearchBranchesParams
): Promise<SearchBranchesResult> {
  const supabase = await createClient();
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  // Build the query
  let query = supabase
    .from("groups")
    .select(`
      *,
      cities (
        id,
        name,
        code,
        city_class,
        provinces (
          id,
          name,
          code,
          regions (
            id,
            name,
            code
          )
        )
      ),
      barangays (
        id,
        name,
        code
      ),
      categories (
        id,
        name,
        slug,
        icon
      ),
      users!groups_organizer_user_id_fkey (
        name
      ),
      group_members (
        count
      )
    `, { count: "exact" })
    .eq("is_discoverable", true)
    .eq("status", "forming") // Only show branches that are still accepting members
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  // Apply filters
  if (params.barangayId) {
    query = query.eq("barangay_id", params.barangayId);
  } else if (params.cityId) {
    query = query.eq("city_id", params.cityId);
  }

  if (params.categoryId) {
    query = query.eq("category_id", params.categoryId);
  }

  if (params.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error searching branches:", error);
    return { branches: [], total: 0, hasMore: false };
  }

  // Filter by region if specified (need to do this in-memory since regions is nested)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let filteredData = (data || []) as any[];
  if (params.regionId && filteredData.length > 0) {
    filteredData = filteredData.filter((branch) => {
      const city = branch.cities as { provinces?: { regions?: { id?: string } } } | null;
      return city?.provinces?.regions?.id === params.regionId;
    });
  }

  return {
    branches: filteredData as unknown as DiscoverableBranch[],
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

// Update branch location and discoverability
export async function updateBranchLocation(
  branchId: string,
  cityId: string | null,
  barangayId: string | null,
  isDiscoverable: boolean
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is organizer of this branch
  const { data: group } = await supabase
    .from("groups")
    .select("organizer_user_id")
    .eq("id", branchId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupData = group as any;
  if (!groupData || groupData.organizer_user_id !== user.id) {
    return { success: false, error: "Only organizers can update branch location" };
  }

  // Update the branch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("groups")
    .update({
      city_id: cityId,
      barangay_id: barangayId,
      is_discoverable: isDiscoverable,
    })
    .eq("id", branchId);

  if (error) {
    console.error("Error updating branch location:", error);
    return { success: false, error: "Failed to update location" };
  }

  return { success: true };
}
