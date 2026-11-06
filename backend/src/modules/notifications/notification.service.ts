import { prisma } from "../../lib/prisma.js";
import type { NotificationType, Prisma } from "../../generated/prisma/client.js";
import { sendPushNotification } from "./firebase-messaging.service.js";

type CreateNotificationInput = {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
};

// Create notification
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data,
}: CreateNotificationInput) => {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      ...(data !== undefined ? { data } : {}),
    },
  });
};

// Get user notifications (newest first)
export const getUserNotifications = async (userId: number) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

// Count unread notifications
export const getUnreadNotificationCount = async (userId: number) => {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
};

// Mark one notification as read
export const markNotificationAsRead = async (
  userId: number,
  notificationId: number
) => {
  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return result.count;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: number) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return result.count;
};

// Delete notification
export const deleteNotification = async (
  userId: number,
  notificationId: number
) => {
  const result = await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId,
    },
  });

  return result.count;
};

export const deliverNotificationPush = async (
  notification: {
    id: number;
    userId: number;
    title: string;
    message: string;
    data: Prisma.JsonValue | null;
  }
) => {
  try {
    const pushData: Record<string, string> = {
      notificationId: String(notification.id),
    };

    // FCM custom data values must be strings.
    if (
      notification.data &&
      typeof notification.data === "object" &&
      !Array.isArray(notification.data)
    ) {
      for (const [key, value] of Object.entries(notification.data)) {
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          pushData[key] = String(value);
        }
      }
    }

    const result = await sendPushNotification({
      userId: notification.userId,
      title: notification.title,
      body: notification.message,
      data: pushData,
    });

    if (result.failureCount > 0) {
      console.warn(
        `FCM delivery had ${result.failureCount} failed sends for notification ${notification.id}`
      );
    }

    return result;
  } catch (error) {
    console.error(
      `FCM delivery failed for notification ${notification.id}:`,
      error
    );

    return {
      successCount: 0,
      failureCount: 0,
    };
  }
};
