import { Prisma, NotificationType } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { deliverNotificationPush } from "./notification.service.js";

const WARNING_THRESHOLD = 80;
const EXCEEDED_THRESHOLD = 100;

export const checkBudgetNotifications = async (
  userId: number,
  categoryId: number,
  month: number,
  year: number,
) => {
  // Find budget for the specified category and month
  const budget = await prisma.budget.findUnique({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId,
        month,
        year,
      },
    },
    include: {
      category: true,
    },
  });

  if (!budget) return;

  // Calculate spending for the relevant month
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const spending = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId,
      type: "EXPENSE",
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const totalSpent = spending._sum.amount ?? new Prisma.Decimal(0);
  const budgetAmount = budget.amount;

  if (budgetAmount.lte(0)) return;

  const percentage = totalSpent.div(budgetAmount).mul(100);

  let notificationType: NotificationType | null = null;

  if (percentage.gte(EXCEEDED_THRESHOLD)) {
    notificationType = NotificationType.BUDGET_EXCEEDED;
  } else if (percentage.gte(WARNING_THRESHOLD)) {
    notificationType = NotificationType.BUDGET_WARNING;
  }

  if (!notificationType) return;

  const dedupeKey = `budget:${userId}:${categoryId}:${year}:${month}:${notificationType}`;

  const title =
    notificationType === NotificationType.BUDGET_EXCEEDED
      ? "Budget Limit Reached"
      : "Budget Warning";

  const message =
    notificationType === NotificationType.BUDGET_EXCEEDED
      ? `Your ${budget.category.name} spending has reached or exceeded its monthly budget.`
      : `You've used at least 80% of your ${budget.category.name} budget.`;

  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: notificationType,
        title,
        message,
        dedupeKey,
        data: {
          budgetId: budget.id,
          categoryId,
          month,
          year,
        },
      },
    });

    // Send push only when a new notification is created.
    await deliverNotificationPush(notification);
  } catch (error) {
    // Duplicate notification: already created for this threshold.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return;
    }

    throw error;
  }
};
