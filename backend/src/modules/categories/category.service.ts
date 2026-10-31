import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateCategoryInput } from "./category.schema.js";

export class CategoryAlreadyExistsError extends Error {
  constructor() {
    super("Category already exists");
    this.name = "CategoryAlreadyExistsError";
  }
}

// Create Category
export const createCategory = async (
  userId: number,
  data: CreateCategoryInput,
) => {
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        type: data.type,
        userId,
      },
    });

    return category;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CategoryAlreadyExistsError();
    }

    throw error;
  }
};
