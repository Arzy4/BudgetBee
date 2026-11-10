import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/auth-request.js";

import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  acknowledgeForegroundNotification,
} from "./notification.service.js";

// GET /api/notifications
export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const userId = req.user.id;

    const notifications = await getUserNotifications(userId);

    res.status(200).json({
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      message: "Failed to retrieve notifications",
    });
  }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const userId = req.user.id;

    const count = await getUnreadNotificationCount(userId);

    res.status(200).json({
      message: "Unread notification count retrieved successfully",
      data: { count },
    });
  } catch (error) {
    console.error("Get unread count error:", error);

    res.status(500).json({
      message: "Failed to retrieve unread notification count",
    });
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const userId = req.user.id;

    const notificationId = Number(req.params.id);

    if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
      res.status(400).json({
        message: "Invalid notification ID",
      });
      return;
    }

    const updatedCount = await markNotificationAsRead(userId, notificationId);

    if (updatedCount === 0) {
      res.status(404).json({
        message: "Notification not found or already read",
      });
      return;
    }

    res.status(200).json({
      message: "Notification marked as read successfully",
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const userId = req.user.id;

    const updatedCount = await markAllNotificationsAsRead(userId);

    res.status(200).json({
      message: "All notifications marked as read successfully",
      data: { updatedCount },
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);

    res.status(500).json({
      message: "Failed to mark all notifications as read",
    });
  }
};

// DELETE /api/notifications/:id
export const removeNotification = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const userId = req.user.id;
    
    const notificationId = Number(req.params.id);

    if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
      res.status(400).json({
        message: "Invalid notification ID",
      });
      return;
    }

    const deletedCount = await deleteNotification(userId, notificationId);

    if (deletedCount === 0) {
      res.status(404).json({
        message: "Notification not found",
      });
      return;
    }

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);

    res.status(500).json({
      message: "Failed to delete notification",
    });
  }
};

export const acknowledgeForeground = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const userId = req.user.id;
    const notificationId = Number(req.params.id);

    if (
      !Number.isSafeInteger(notificationId) ||
      notificationId <= 0
    ) {
      res.status(400).json({
        message: "Invalid notification ID",
      });
      return;
    }

    const deletedCount = await acknowledgeForegroundNotification(
      userId,
      notificationId,
    );

    if (deletedCount === 0) {
      res.status(404).json({
        message: "Foreground budget notification not found",
      });
      return;
    }

    res.status(200).json({
      message: "Foreground notification acknowledged successfully",
    });
  } catch (error) {
    console.error("Acknowledge foreground notification error:", error);

    res.status(500).json({
      message: "Failed to acknowledge foreground notification",
    });
  }
};
