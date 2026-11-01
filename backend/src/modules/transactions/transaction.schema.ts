import { z } from "zod";

export const createTransactionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Transaction title is required")
    .max(100, "Transaction title cannot exceed 100 characters"),

  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
      "Amount cannot have more than 2 decimal places",
    ),

  type: z.enum(["INCOME", "EXPENSE"]),

  categoryId: z.number().int().positive(),

  paymentMethod: z
    .enum(["CASH", "BANK_TRANSFER", "E_WALLET", "CARD"])
    .optional(),

  description: z.string().trim().max(500).optional(),

  date: z.iso.datetime({ offset: true }).optional(),
});

// Update Transaction Schema
export const updateTransactionSchema = createTransactionSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided",
  );

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
