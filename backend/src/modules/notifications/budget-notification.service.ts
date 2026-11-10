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

  if (!budget || budget.amount.lte(0)) return;

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

  const percentage = totalSpent.div(budget.amount).mul(100);

  const isWarning = percentage.gte(WARNING_THRESHOLD);
  const isExceeded = percentage.gte(EXCEEDED_THRESHOLD);

  // Initialize alert state if it doesn't exist.
  const previousState = await prisma.budgetAlertState.upsert({
    where: {
      budgetId: budget.id,
    },
    create: {
      budgetId: budget.id,
      warningActive: false,
      exceededActive: false,
    },
    update: {},
  });

  let notificationType: NotificationType | null = null;

  // Prioritize exceeded notifications.
  if (isExceeded && !previousState.exceededActive) {
    notificationType = NotificationType.BUDGET_EXCEEDED;
  } else if (
    isWarning &&
    !isExceeded &&
    !previousState.warningActive
  ) {
    notificationType = NotificationType.BUDGET_WARNING;
  }

  // Update threshold state independently from notification history.
  await prisma.budgetAlertState.update({
    where: {
      budgetId: budget.id,
    },
    data: {
      warningActive: isWarning,
      exceededActive: isExceeded,
    },
  });

  if (!notificationType) return;

  const title =
    notificationType === NotificationType.BUDGET_EXCEEDED
      ? "Budget Limit Reached"
      : "Budget Warning";

  const message =
    notificationType === NotificationType.BUDGET_EXCEEDED
      ? `Your ${budget.category.name} spending has reached or exceeded its monthly budget.`
      : `You've used at least 80% of your ${budget.category.name} budget.`;

  const notification = await prisma.notification.create({
    data: {
      userId,
      type: notificationType,
      title,
      message,
      data: {
        budgetId: budget.id,
        categoryId,
        month,
        year,
      },
    },
  });

  await deliverNotificationPush(notification);
};