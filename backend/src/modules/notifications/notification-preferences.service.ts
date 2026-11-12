import { prisma } from "../../lib/prisma.js";

export type NotificationPreferencesInput = {
  pushNotifications: boolean;
  budgetAlerts: boolean;
  budgetWarning: boolean;
  budgetExceeded: boolean;
  monthlyReminders: boolean;
  securityAlerts: boolean;
};

export const getNotificationPreferences = async (userId: number) => {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
};

export const updateNotificationPreferences = async (
  userId: number,
  preferences: NotificationPreferencesInput
) => {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: preferences,
    create: {
      userId,
      ...preferences,
    },
  });
};
