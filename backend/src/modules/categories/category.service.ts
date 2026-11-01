import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.schema.js";
import { createCategorySchema } from "./category.schema.js";

export class CategoryAlreadyExistsError extends Error {
  constructor() {
    super("Category already exists");
    this.name = "CategoryAlreadyExistsError";
  }
}

// Get Categories by User
export async function getCategoriesByUser(userId: number) {
  const categories = await prisma.category.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      name: true,
      type: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return categories
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

// Update Category
export class CategoryNotFoundError extends Error {
  constructor() {
    super("Category not found");
    this.name = "CategoryNotFoundError";
  }
}

export class CategoryInUseError extends Error {
  constructor() {
    super("Cannot change the type of a category used by transactions");
    this.name = "CategoryInUseError";
  }
}

export const updateCategory = async (
  userId: number,
  categoryId: number,
  data: UpdateCategoryInput,
) => {
  const existingCategory = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
    },
  });

  if (!existingCategory) {
    throw new CategoryNotFoundError();
  }

  const validatedData = createCategorySchema.parse({
    name: data.name ?? existingCategory.name,
    type: data.type ?? existingCategory.type,
  });

  if (validatedData.type !== existingCategory.type) {
    const transactionCount = await prisma.transaction.count({
      where: {
        categoryId,
        userId,
      },
    });

    if (transactionCount > 0) {
      throw new CategoryInUseError();
    }
  }

  try {
    return await prisma.category.update({
      where: {
        id: categoryId,
        userId,
      },
      data: validatedData,
    });
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

// Delete Category
export class CategoryDeletionConflictError extends Error {
  constructor() {
    super("Cannot delete a category used by transactions or budgets");
    this.name = "CategoryDeletionConflictError";
  }
}

// Delete Category
export const deleteCategory = async (
  userId: number,
  categoryId: number,
) => {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
    },
  });

  if (!category) {
    throw new CategoryNotFoundError();
  }

  // Check whether the category is used by transactions
  const transactionCount = await prisma.transaction.count({
    where: {
      categoryId,
      userId,
    },
  });

  // Check whether the category is used by budgets
  const budgetCount = await prisma.budget.count({
    where: {
      categoryId,
      userId,
    },
  });

  if (transactionCount > 0 || budgetCount > 0) {
    throw new CategoryDeletionConflictError();
  }

  // Delete category belonging to the authenticated user
  try {
    await prisma.category.delete({
      where: {
        id: categoryId,
        userId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new CategoryDeletionConflictError();
    }

    throw error;
  }
};