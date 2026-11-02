import { z } from "zod";

// Budget ID Parameter Schema
export const budgetIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Get Budgets Query Schema
export const getBudgetsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),

  year: z.coerce.number().int().min(2000).max(2100),
});

// Create Budget Schema
export const createBudgetSchema = z
  .object({
    categoryId: z.coerce.number().int().positive(),

    amount: z.coerce
      .number()
      .positive("Budget amount must be greater than zero")
      .refine(
        (value) => Number.isFinite(value) && Number.isSafeInteger(value * 100),
        "Budget amount must have at most 2 decimal places and be within the supported range",
      ),

    month: z.coerce.number().int().min(1).max(12).optional(),

    year: z.coerce.number().int().min(2000).max(2100).optional(),
  })
  .refine((data) => (data.month === undefined) === (data.year === undefined), {
    message: "Month and year must be provided together",
    path: ["month"],
  });

// Update Budget Schema
export const updateBudgetSchema = z
  .object({
    categoryId: z.coerce.number().int().positive().optional(),

    amount: createBudgetSchema.shape.amount.optional(),
  })
  .refine(
    (data) => data.categoryId !== undefined || data.amount !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

// TypeScript Types
export type BudgetIdParams = z.infer<typeof budgetIdParamSchema>;

export type GetBudgetsQuery = z.infer<typeof getBudgetsQuerySchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
