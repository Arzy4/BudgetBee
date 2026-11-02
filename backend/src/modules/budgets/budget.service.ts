import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateBudgetInput,
  GetBudgetsQuery,
  UpdateBudgetInput,
} from "./budget.schema.js";

// Custom Errors
export class BudgetCategoryNotFoundError extends Error {
  constructor() {
    super("Expense category not found");
    this.name = "BudgetCategoryNotFoundError";
  }
}

export class BudgetAlreadyExistsError extends Error {
  constructor() {
    super("A budget already exists for this category and month");
    this.name = "BudgetAlreadyExistsError";
  }
}

export class BudgetNotFoundError extends Error {
  constructor() {
    super("Budget not found");
    this.name = "BudgetNotFoundError";
  }
}

// Current Month and Year (WIB)
function getCurrentBudgetPeriod() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    month: "numeric",
    year: "numeric",
  }).formatToParts(new Date());

  const month = Number(parts.find((part) => part.type === "month")?.value);

  const year = Number(parts.find((part) => part.type === "year")?.value);

  return { month, year };
}

// Get Budgets
export async function getBudgets(userId: number, query: GetBudgetsQuery) {
  const { month, year } = query;

  // Use UTC month boundaries consistently
  const startDate = new Date(Date.UTC(year, month - 1, 1, -7));

  const endDate = new Date(Date.UTC(year, month, 1, -7));

  // Retrieve budgets for the selected period
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      month,
      year,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Calculate expenses for budgeted categories
  const categoryIds = budgets.map((budget) => budget.categoryId);

  const spending =
    categoryIds.length > 0
      ? await prisma.transaction.groupBy({
          by: ["categoryId"],
          where: {
            userId,
            categoryId: {
              in: categoryIds,
            },
            type: "EXPENSE",
            date: {
              gte: startDate,
              lt: endDate,
            },
          },
          _sum: {
            amount: true,
          },
        })
      : [];

  // Match spending to each category
  const spendingMap = new Map(
    spending.map((item) => [
      item.categoryId,
      item._sum.amount ?? new Prisma.Decimal(0),
    ]),
  );

  // Monthly totals
  let totalBudget = new Prisma.Decimal(0);
  let totalSpent = new Prisma.Decimal(0);

  // Calculate individual budget progress
  const budgetData = budgets.map((budget) => {
    const amount = budget.amount;

    const spent = spendingMap.get(budget.categoryId) ?? new Prisma.Decimal(0);

    const remaining = amount.minus(spent);

    const percentageUsed = amount.greaterThan(0)
      ? spent.dividedBy(amount).times(100).toNumber()
      : 0;

    const status =
      percentageUsed > 100
        ? "OVER_BUDGET"
        : percentageUsed >= 100
          ? "LIMIT_REACHED"
          : percentageUsed >= 80
            ? "WARNING"
            : "ON_TRACK";

    totalBudget = totalBudget.plus(amount);
    totalSpent = totalSpent.plus(spent);

    return {
      id: budget.id,
      category: budget.category,
      amount: amount.toString(),
      spent: spent.toString(),
      remaining: remaining.toString(),
      percentageUsed: Number(percentageUsed.toFixed(2)),
      status,
    };
  });

  const totalRemaining = totalBudget.minus(totalSpent);

  const percentageUsed = totalBudget.greaterThan(0)
    ? totalSpent.dividedBy(totalBudget).times(100).toNumber()
    : 0;

  return {
    month,
    year,
    summary: {
      totalBudget: totalBudget.toString(),
      totalSpent: totalSpent.toString(),
      totalRemaining: totalRemaining.toString(),
      percentageUsed: Number(percentageUsed.toFixed(2)),
    },
    budgets: budgetData,
  };
}

// Create Budget
export async function createBudget(userId: number, data: CreateBudgetInput) {
  const currentPeriod = getCurrentBudgetPeriod();

  const month = data.month ?? currentPeriod.month;
  const year = data.year ?? currentPeriod.year;

  // Verify category ownership and type
  const category = await prisma.category.findFirst({
    where: {
      id: data.categoryId,
      userId,
      type: "EXPENSE",
    },
    select: {
      id: true,
    },
  });

  if (!category) {
    throw new BudgetCategoryNotFoundError();
  }

  // Create budget
  try {
    const budget = await prisma.budget.create({
      data: {
        userId,
        categoryId: category.id,
        amount: data.amount,
        month,
        year,
      },
      select: {
        id: true,
        amount: true,
        month: true,
        year: true,
        categoryId: true,
        createdAt: true,
      },
    });

    return budget;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BudgetAlreadyExistsError();
    }

    throw error;
  }
}

// Update Budget
export async function updateBudget(
  userId: number,
  budgetId: number,
  data: UpdateBudgetInput,
) {
  // Verify budget ownership
  const existingBudget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      userId,
    },
  });

  if (!existingBudget) {
    throw new BudgetNotFoundError();
  }

  // Verify new category if provided
  if (data.categoryId !== undefined) {
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        userId,
        type: "EXPENSE",
      },
    });

    if (!category) {
      throw new BudgetCategoryNotFoundError();
    }
  }

  // Update budget
  try {
    const budget = await prisma.budget.update({
      where: {
        id: budgetId,
        userId,
      },
      data: {
        ...(data.categoryId !== undefined && {
          categoryId: data.categoryId,
        }),
        ...(data.amount !== undefined && {
          amount: data.amount,
        }),
      },
      select: {
        id: true,
        amount: true,
        month: true,
        year: true,
        categoryId: true,
        updatedAt: true,
      },
    });

    return budget;
  } catch (error) {
    // Prevent duplicate budgets in the same period
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BudgetAlreadyExistsError();
    }

    // Budget deleted between lookup and update
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new BudgetNotFoundError();
    }

    throw error;
  }
}

// Delete Budget
export async function deleteBudget(
  userId: number,
  budgetId: number,
) {
  // Delete only budgets belonging to the authenticated user
  const result = await prisma.budget.deleteMany({
    where: {
      id: budgetId,
      userId,
    },
  })

  // Handle nonexistent or unauthorized budgets
  if (result.count === 0) {
    throw new BudgetNotFoundError()
  }

  return {
    id: budgetId,
  }
}
