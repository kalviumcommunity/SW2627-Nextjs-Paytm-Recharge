import { z } from "zod";

export const rechargeSchema = z.object({
  mobileNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),

  selectedOperator: z
    .string()
    .min(1, "Please select an operator"),

  amount: z
    .number()
    .min(10, "Recharge amount must be at least Rs. 10"),
});

export type RechargeFormData = z.infer<typeof rechargeSchema>;