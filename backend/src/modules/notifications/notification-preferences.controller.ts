import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/auth-request.js";

import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferencesInput,
} from "./notification-preferences.service.js";

const preferenceKeys: (keyof NotificationPreferencesInput)[] = [
  "pushNotifications",
  "budgetAlerts",
  "budgetWarning",
  "budgetExceeded",
  "monthlyReminders",
  "securityAlerts",
];

// GET /api/notifications/preferences
export const getPreferences = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const preferences = await getNotificationPreferences(req.user.id);

    res.status(200).json({
      message: "Notification preferences retrieved successfully",
      data: preferences,
    });
  } catch (error) {
    console.error("Get notification preferences error:", error);

    res.status(500).json({
      message: "Failed to retrieve notification preferences",
    });
  }
};

// PATCH /api/notifications/preferences
export const savePreferences = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const body = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      preferenceKeys.some((key) => typeof body[key] !== "boolean") ||
      Object.keys(body).some(
        (key) => !preferenceKeys.includes(key as keyof NotificationPreferencesInput)
      )
    ) {
      res.status(400).json({
        message: "Invalid notification preferences",
      });
      return;
    }

    const input = Object.fromEntries(
      preferenceKeys.map((key) => [key, body[key]])
    ) as NotificationPreferencesInput;

    const preferences = await updateNotificationPreferences(
      req.user.id,
      input
    );

    res.status(200).json({
      message: "Notification preferences saved successfully",
      data: preferences,
    });
  } catch (error) {
    console.error("Save notification preferences error:", error);

    res.status(500).json({
      message: "Failed to save notification preferences",
    });
  }
};
