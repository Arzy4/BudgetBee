import { z } from "zod";

const categoryBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name cannot exceed 100 characters"),

  type: z.enum(["INCOME", "EXPENSE"]),
});

// Create Category
export const createCategorySchema = categoryBaseSchema;

// Update Category
export const updateCategorySchema = categoryBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type CreateCategoryInput = z.infer<
  typeof createCategorySchema
>;

export type UpdateCategoryInput = z.infer<
  typeof updateCategorySchema
>;