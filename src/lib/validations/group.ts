import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, "Group name must be at least 3 characters")
    .max(50, "Group name must be less than 50 characters"),
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
    .min(2, "Minimum 2 members required")
    .max(50, "Maximum 50 members allowed"),
  payout_order_method: z.enum(["fixed", "lottery", "organizer_assigned"], {
    required_error: "Please select a payout order method",
  }),
  rules_json: z
    .object({
      grace_period_days: z.number().min(0).max(7).optional(),
      late_fee_percent: z.number().min(0).max(50).optional(),
      auto_approve_members: z.boolean().optional(),
    })
    .optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const joinGroupSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
});

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
