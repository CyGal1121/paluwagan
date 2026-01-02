import { z } from "zod";
import { BRANCH_SLOTS, ORGANIZER_FEE } from "@/types/database";

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, "Branch name must be at least 3 characters")
    .max(50, "Branch name must be less than 50 characters"),
  contribution_amount: z
    .number()
    .min(100, "Minimum contribution is ₱100")
    .max(1000000, "Maximum contribution is ₱1,000,000"),
  frequency: z.enum(["weekly", "biweekly", "monthly"], {
    required_error: "Please select a frequency",
  }),
  start_date: z.string().refine((date) => {
    const startDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return startDate >= today;
  }, "Start date must be today or in the future"),
  members_limit: z
    .number()
    .min(BRANCH_SLOTS, `Branch must have ${BRANCH_SLOTS} slots`)
    .max(BRANCH_SLOTS, `Branch must have ${BRANCH_SLOTS} slots`)
    .default(BRANCH_SLOTS),
  payout_order_method: z.enum(["fixed", "lottery", "organizer_assigned"], {
    required_error: "Please select a payout order method",
  }),
  category_id: z.string().uuid("Please select a category").optional(),
  organizer_joins: z.boolean().default(false), // Whether organizer joins as a member
  organizer_fee_type: z.enum(["percentage", "fixed"], {
    required_error: "Please select a fee type",
  }).default("percentage"),
  organizer_fee_value: z
    .number()
    .min(ORGANIZER_FEE.MIN_PERCENTAGE, `Minimum fee is ${ORGANIZER_FEE.MIN_PERCENTAGE}%`)
    .max(ORGANIZER_FEE.MAX_PERCENTAGE, `Maximum fee is ${ORGANIZER_FEE.MAX_PERCENTAGE}%`)
    .default(ORGANIZER_FEE.DEFAULT_PERCENTAGE),
  rules_json: z
    .object({
      grace_period_days: z.number().min(0).max(7).optional(),
      late_fee_percent: z.number().min(0).max(50).optional(),
      auto_approve_members: z.boolean().optional(),
    })
    .optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

// Alias for semantic clarity
export type CreateBranchInput = CreateGroupInput;

export const joinGroupSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
});

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
export type JoinBranchInput = JoinGroupInput;
