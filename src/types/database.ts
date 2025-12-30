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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone?: string | null;
          name?: string | null;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          name?: string | null;
          photo_url?: string | null;
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
          members_limit: number;
          payout_order_method: "fixed" | "lottery" | "organizer_assigned";
          rules_json?: Json | null;
          status?: "forming" | "active" | "completed" | "cancelled";
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
          entity_type: "contribution" | "payout" | "member" | "group" | "cycle" | "invite";
          entity_id: string;
          action: string;
          metadata_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          actor_user_id: string;
          entity_type: "contribution" | "payout" | "member" | "group" | "cycle" | "invite";
          entity_id: string;
          action: string;
          metadata_json?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          actor_user_id?: string;
          entity_type?: "contribution" | "payout" | "member" | "group" | "cycle" | "invite";
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

// Extended types with relations
export type GroupWithMembers = Group & {
  group_members: (GroupMember & { users: User })[];
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
