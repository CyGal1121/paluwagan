export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          name: string | null;
          photo_url: string | null;
          id_photo_url: string | null;
          id_verification_status: "none" | "pending" | "verified" | "rejected";
          id_verified_at: string | null;
          id_verified_by: string | null;
          id_rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone?: string | null;
          name?: string | null;
          photo_url?: string | null;
          id_photo_url?: string | null;
          id_verification_status?: "none" | "pending" | "verified" | "rejected";
          id_verified_at?: string | null;
          id_verified_by?: string | null;
          id_rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          name?: string | null;
          photo_url?: string | null;
          id_photo_url?: string | null;
          id_verification_status?: "none" | "pending" | "verified" | "rejected";
          id_verified_at?: string | null;
          id_verified_by?: string | null;
          id_rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          is_custom: boolean;
          created_by: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          is_custom?: boolean;
          created_by?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          is_custom?: boolean;
          created_by?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          organizer_user_id: string;
          name: string;
          contribution_amount: number;
          frequency: "weekly" | "biweekly" | "monthly";
          start_date: string;
          members_limit: number;
          payout_order_method: "fixed" | "lottery" | "organizer_assigned";
          rules_json: Json | null;
          status: "forming" | "active" | "completed" | "cancelled";
          category_id: string | null;
          display_order: number;
          organizer_fee_type: "percentage" | "fixed";
          organizer_fee_value: number;
          city_id: string | null;
          barangay_id: string | null;
          is_discoverable: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organizer_user_id: string;
          name: string;
          contribution_amount: number;
          frequency: "weekly" | "biweekly" | "monthly";
          start_date: string;
          members_limit?: number;
          payout_order_method: "fixed" | "lottery" | "organizer_assigned";
          rules_json?: Json | null;
          status?: "forming" | "active" | "completed" | "cancelled";
          category_id?: string | null;
          display_order?: number;
          organizer_fee_type?: "percentage" | "fixed";
          organizer_fee_value?: number;
          city_id?: string | null;
          barangay_id?: string | null;
          is_discoverable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organizer_user_id?: string;
          name?: string;
          contribution_amount?: number;
          frequency?: "weekly" | "biweekly" | "monthly";
          start_date?: string;
          members_limit?: number;
          payout_order_method?: "fixed" | "lottery" | "organizer_assigned";
          rules_json?: Json | null;
          status?: "forming" | "active" | "completed" | "cancelled";
          category_id?: string | null;
          display_order?: number;
          organizer_fee_type?: "percentage" | "fixed";
          organizer_fee_value?: number;
          city_id?: string | null;
          barangay_id?: string | null;
          is_discoverable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      regions: {
        Row: {
          id: string;
          code: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          created_at?: string;
        };
      };
      provinces: {
        Row: {
          id: string;
          region_id: string;
          code: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          region_id: string;
          code: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          region_id?: string;
          code?: string;
          name?: string;
          created_at?: string;
        };
      };
      cities: {
        Row: {
          id: string;
          province_id: string;
          code: string;
          name: string;
          city_class: "city" | "municipality" | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          province_id: string;
          code: string;
          name: string;
          city_class?: "city" | "municipality" | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          province_id?: string;
          code?: string;
          name?: string;
          city_class?: "city" | "municipality" | null;
          created_at?: string;
        };
      };
      barangays: {
        Row: {
          id: string;
          city_id: string;
          code: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          city_id: string;
          code: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          city_id?: string;
          code?: string;
          name?: string;
          created_at?: string;
        };
      };
      branch_fees: {
        Row: {
          id: string;
          branch_id: string;
          fee_type: "setup" | "monthly";
          amount: number;
          due_date: string | null;
          period_start: string | null;
          period_end: string | null;
          status: "unpaid" | "paid" | "waived";
          paid_at: string | null;
          paid_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          fee_type: "setup" | "monthly";
          amount: number;
          due_date?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          status?: "unpaid" | "paid" | "waived";
          paid_at?: string | null;
          paid_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          branch_id?: string;
          fee_type?: "setup" | "monthly";
          amount?: number;
          due_date?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          status?: "unpaid" | "paid" | "waived";
          paid_at?: string | null;
          paid_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: "organizer" | "member";
          status: "pending" | "active" | "frozen" | "removed";
          payout_position: number | null;
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role: "organizer" | "member";
          status?: "pending" | "active" | "frozen" | "removed";
          payout_position?: number | null;
          joined_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: "organizer" | "member";
          status?: "pending" | "active" | "frozen" | "removed";
          payout_position?: number | null;
          joined_at?: string;
          updated_at?: string;
        };
      };
      invites: {
        Row: {
          id: string;
          group_id: string;
          token: string;
          created_by: string;
          expires_at: string;
          max_uses: number | null;
          use_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          token: string;
          created_by: string;
          expires_at: string;
          max_uses?: number | null;
          use_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          token?: string;
          created_by?: string;
          expires_at?: string;
          max_uses?: number | null;
          use_count?: number;
          created_at?: string;
        };
      };
      cycles: {
        Row: {
          id: string;
          group_id: string;
          cycle_number: number;
          start_date: string;
          due_date: string;
          payout_user_id: string | null;
          status: "upcoming" | "open" | "closing" | "closed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          cycle_number: number;
          start_date: string;
          due_date: string;
          payout_user_id?: string | null;
          status?: "upcoming" | "open" | "closing" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          cycle_number?: number;
          start_date?: string;
          due_date?: string;
          payout_user_id?: string | null;
          status?: "upcoming" | "open" | "closing" | "closed";
          created_at?: string;
          updated_at?: string;
        };
      };
      contributions: {
        Row: {
          id: string;
          group_id: string;
          cycle_id: string;
          user_id: string;
          amount: number;
          status: "unpaid" | "pending_proof" | "paid_confirmed" | "disputed";
          proof_url: string | null;
          note: string | null;
          confirmed_by_user_id: string | null;
          is_late: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          cycle_id: string;
          user_id: string;
          amount: number;
          status?: "unpaid" | "pending_proof" | "paid_confirmed" | "disputed";
          proof_url?: string | null;
          note?: string | null;
          confirmed_by_user_id?: string | null;
          is_late?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          cycle_id?: string;
          user_id?: string;
          amount?: number;
          status?: "unpaid" | "pending_proof" | "paid_confirmed" | "disputed";
          proof_url?: string | null;
          note?: string | null;
          confirmed_by_user_id?: string | null;
          is_late?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      payouts: {
        Row: {
          id: string;
          cycle_id: string;
          group_id: string;
          recipient_user_id: string;
          amount: number;
          status: "scheduled" | "sent_by_organizer" | "confirmed_by_recipient" | "disputed";
          sent_at: string | null;
          confirmed_at: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cycle_id: string;
          group_id: string;
          recipient_user_id: string;
          amount: number;
          status?: "scheduled" | "sent_by_organizer" | "confirmed_by_recipient" | "disputed";
          sent_at?: string | null;
          confirmed_at?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cycle_id?: string;
          group_id?: string;
          recipient_user_id?: string;
          amount?: number;
          status?: "scheduled" | "sent_by_organizer" | "confirmed_by_recipient" | "disputed";
          sent_at?: string | null;
          confirmed_at?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          group_id: string;
          actor_user_id: string;
          entity_type: "contribution" | "payout" | "member" | "group" | "cycle" | "invite" | "verification";
          entity_id: string;
          action: string;
          metadata_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          actor_user_id: string;
          entity_type: "contribution" | "payout" | "member" | "group" | "cycle" | "invite" | "verification";
          entity_id: string;
          action: string;
          metadata_json?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          actor_user_id?: string;
          entity_type?: "contribution" | "payout" | "member" | "group" | "cycle" | "invite" | "verification";
          entity_id?: string;
          action?: string;
          metadata_json?: Json | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          group_id: string | null;
          type: string;
          title: string;
          message: string;
          data_json: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id?: string | null;
          type: string;
          title: string;
          message: string;
          data_json?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string | null;
          type?: string;
          title?: string;
          message?: string;
          data_json?: Json | null;
          read?: boolean;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          content: string;
          reply_to_id: string | null;
          is_system_message: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          content: string;
          reply_to_id?: string | null;
          is_system_message?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          content?: string;
          reply_to_id?: string | null;
          is_system_message?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_read_receipts: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          last_read_message_id: string | null;
          last_read_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          last_read_message_id?: string | null;
          last_read_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          last_read_message_id?: string | null;
          last_read_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Commonly used types
export type User = Tables<"users">;
export type Group = Tables<"groups">;
export type GroupMember = Tables<"group_members">;
export type Invite = Tables<"invites">;
export type Cycle = Tables<"cycles">;
export type Contribution = Tables<"contributions">;
export type Payout = Tables<"payouts">;
export type AuditLog = Tables<"audit_logs">;
export type Notification = Tables<"notifications">;
export type Category = Tables<"categories">;
export type BranchFee = Tables<"branch_fees">;
export type Region = Tables<"regions">;
export type Province = Tables<"provinces">;
export type City = Tables<"cities">;
export type Barangay = Tables<"barangays">;
export type ChatMessage = Tables<"chat_messages">;
export type ChatReadReceipt = Tables<"chat_read_receipts">;

// Semantic aliases: Branch = Group (UI-facing name)
export type Branch = Group;
export type BranchMember = GroupMember;
export type BranchMemberWithUser = GroupMemberWithUser;

// Extended types with relations
export type GroupWithMembers = Group & {
  group_members: (GroupMember & { users: User })[];
};

export type BranchWithCategory = Branch & {
  categories: Category | null;
};

export type BranchWithFees = Branch & {
  branch_fees: BranchFee[];
};

export type CategoryWithBranches = Category & {
  groups: Branch[];
};

export type BranchWithLocation = Branch & {
  cities: City | null;
  barangays: Barangay | null;
};

export type DiscoverableBranch = Branch & {
  cities: (City & { provinces: Province & { regions: Region } }) | null;
  barangays: Barangay | null;
  categories: Category | null;
  group_members: { count: number }[];
  users: { name: string | null } | null; // organizer info
};

export type CycleWithDetails = Cycle & {
  contributions: (Contribution & { users: User })[];
  payouts: (Payout & { users: User })[];
  payout_user: User | null;
};

export type ContributionWithUser = Contribution & {
  users: User;
};

export type GroupMemberWithUser = GroupMember & {
  users: User;
};

// Chat types with relations
export type ChatMessageWithUser = ChatMessage & {
  users: Pick<User, "id" | "name" | "photo_url">;
  reply_to?: ChatMessageWithUser | null;
};

// User verification helper type
export type UserWithVerification = User & {
  isVerified: boolean;
  canCreateBranch: boolean;
  canJoinBranch: boolean;
};

// Fee constants
export const BRANCH_FEES = {
  SETUP: 99, // PHP one-time
  MONTHLY: 100, // PHP per month
} as const;

// Branch slot limit
export const BRANCH_SLOTS = 10;

// Organizer fee limits (percentage)
export const ORGANIZER_FEE = {
  MIN_PERCENTAGE: 3,
  MAX_PERCENTAGE: 10,
  DEFAULT_PERCENTAGE: 5,
} as const;

// Membership limits
export const MEMBERSHIP_LIMITS = {
  MAX_BRANCHES: 3,
  MAX_MONTHLY_CONTRIBUTION: 3000, // PHP
} as const;

// Helper function to calculate monthly equivalent contribution
export function calculateMonthlyEquivalent(
  amount: number,
  frequency: "weekly" | "biweekly" | "monthly"
): number {
  switch (frequency) {
    case "weekly":
      return amount * 4;
    case "biweekly":
      return amount * 2;
    case "monthly":
      return amount;
  }
}

// Helper function to calculate net payout after organizer fee
export function calculateNetPayout(
  contributionAmount: number,
  membersCount: number,
  feeType: "percentage" | "fixed",
  feeValue: number
): { grossPayout: number; feeAmount: number; netPayout: number } {
  const grossPayout = contributionAmount * membersCount;
  const feeAmount = feeType === "percentage"
    ? grossPayout * (feeValue / 100)
    : feeValue;
  const netPayout = grossPayout - feeAmount;

  return {
    grossPayout,
    feeAmount: Math.round(feeAmount * 100) / 100, // Round to 2 decimal places
    netPayout: Math.round(netPayout * 100) / 100,
  };
}
