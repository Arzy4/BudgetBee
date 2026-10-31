import { z } from "zod";

export const createCategorySchema = z
  .object({
    name: z.enum([
      "SALARY",
      "GIFTS",
      "INVESTMENT",
      "BONUS",
      "FOOD_AND_DRINKS",
      "HEALTH",
      "FASHION",
      "TRANSPORTATION",
    ]),

    type: z.enum(["INCOME", "EXPENSE"]),
  })
  .refine(
    (data) => {
      const incomeCategories = ["SALARY", "GIFTS", "INVESTMENT", "BONUS"];

      const isIncomeCategory = incomeCategories.includes(data.name);

      return data.type === (isIncomeCategory ? "INCOME" : "EXPENSE");
    },
    {
      message: "Category name does not match transaction type",
      path: ["type"],
    },
  );

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
