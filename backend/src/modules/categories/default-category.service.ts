import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

// Default categories for every new user
export const defaultCategories = [
  { name: "Salary", type: "INCOME" },
  { name: "Gifts", type: "INCOME" },
  { name: "Investment", type: "INCOME" },
  { name: "Bonus", type: "INCOME" },
  { name: "Food & Drinks", type: "EXPENSE" },
  { name: "Health", type: "EXPENSE" },
  { name: "Fashion", type: "EXPENSE" },
  { name: "Transportation", type: "EXPENSE" },
] satisfies Omit<Prisma.CategoryCreateManyInput, "userId">[];

// Insert default categories for a specific user
export const initializeDefaultCategories = async (
  userId: number,
) => {
  return prisma.category.createMany({
    data: defaultCategories.map((category) => ({
      ...category,
      userId,
    })),
    skipDuplicates: true,
  });
};
