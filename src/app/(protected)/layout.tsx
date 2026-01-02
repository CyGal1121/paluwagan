import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProtectedNav } from "@/components/protected-nav";
import { SidebarLayout } from "@/components/sidebar/sidebar-wrapper";

// Type definitions for Supabase query results
interface UserProfile {
  id: string;
  name: string;
  photo_url: string | null;
}

interface MembershipWithGroup {
  role: string;
  groups: {
    id: string;
    name: string;
    status: string;
    category_id: string | null;
    categories: {
      id: string;
      name: string;
      icon: string | null;
    } | null;
  } | null;
}

interface PendingMember {
  group_id: string;
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has completed onboarding
  const { data: profileData } = await supabase
    .from("users")
    .select("id, name, photo_url")
    .eq("id", user.id)
    .single() as { data: UserProfile | null };

  if (!profileData?.name) {
    redirect("/onboarding");
  }

  const profile = profileData;

  // Fetch user's branches for the sidebar
  const { data: memberships } = await supabase
    .from("group_members")
    .select(`
      role,
      groups (
        id,
        name,
        status,
        category_id,
        categories (
          id,
          name,
          icon
        )
      )
    `)
    .eq("user_id", user.id)
    .in("status", ["active", "pending"])
    .order("joined_at", { ascending: false });



  // Get pending member counts for organizer branches
  const typedMemberships = (memberships || []) as unknown as MembershipWithGroup[];
  const branches = typedMemberships
    .filter(m => m.groups !== null)
    .map(m => {
      const group = m.groups!;
      return {
        id: group.id,
        name: group.name,
        status: group.status,
        role: m.role,
        category: group.categories ? {
          icon: group.categories.icon,
          name: group.categories.name,
        } : null,
        pendingCount: 0, // Will be populated if organizer
      };
    });

  // For organizer branches, get pending member counts
  const organizerBranchIds = branches
    .filter(b => b.role === "organizer")
    .map(b => b.id);

  if (organizerBranchIds.length > 0) {
    const { data: pendingCounts } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", organizerBranchIds)
      .eq("status", "pending");

    if (pendingCounts) {
      const typedPendingCounts = pendingCounts as unknown as PendingMember[];
      const countMap = typedPendingCounts.reduce((acc, curr) => {
        acc[curr.group_id] = (acc[curr.group_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      branches.forEach(b => {
        if (countMap[b.id]) {
          b.pendingCount = countMap[b.id];
        }
      });
    }
  }


  return (
    <SidebarLayout
      branches={branches}
      header={<ProtectedNav user={profile} />}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {children}
      </div>
    </SidebarLayout>
  );
}
