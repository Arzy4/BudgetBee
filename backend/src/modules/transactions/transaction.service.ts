import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateTransactionInput } from "./transaction.schema.js";

// Create Transaction Logic
export const createTransaction = async (
  userId: number,
  data: CreateTransactionInput,
) => {
  // 1. Verify that the category belongs to the user
  const category = await prisma.category.findFirst({
    where: {
      id: data.categoryId,
      userId,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  // 2. Verify that category type matches transaction type
  if (category.type !== data.type) {
    throw new Error("Category type must match transaction type");
  }

  // 3. Create the transaction
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      categoryId: data.categoryId,
      type: data.type,
      amount: new Prisma.Decimal(data.amount.toString()),
      paymentMethod: data.paymentMethod,
      description: data.description,
      date: data.date ? new Date(data.date) : new Date(),
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  return transaction;
};
