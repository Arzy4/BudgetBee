import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

// Default categories for every new user
export const defaultCategories = [
  { name: "SALARY", type: "INCOME" },
  { name: "GIFTS", type: "INCOME" },
  { name: "INVESTMENT", type: "INCOME" },
  { name: "BONUS", type: "INCOME" },
  { name: "FOOD & DRINKS", type: "EXPENSE" },
  { name: "HEALTH", type: "EXPENSE" },
  { name: "FASHION", type: "EXPENSE" },
  { name: "TRANSPORTATION", type: "EXPENSE" },
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
