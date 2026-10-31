import { z } from "zod";

export const createAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(100, "Account name cannot exceed 100 characters"),

  type: z.enum(["CASH", "BANK_TRANSFER", "E_WALLET", "CARD"]),

  initialBalance: z
    .number()
    .min(0, "Initial balance cannot be negative")
    .multipleOf(0.01, "Balance cannot exceed 2 decimal places")
    .default(0),
});

export const updateAccountSchema = createAccountSchema
  .safeExtend({
    initialBalance: z
      .number()
      .min(0, "Initial balance cannot be negative")
      .multipleOf(0.01, "Balance cannot exceed 2 decimal places"),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
