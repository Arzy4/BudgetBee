import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  removeNotification,
} from "./notification.controller.js";

import {
  registerDevice,
  unregisterDevice,
} from "./device-token.controller.js";

const router = Router();

router.use(authenticateToken);

// Device routes — before dynamic ID routes
router.post("/devices", registerDevice);
router.delete("/devices", unregisterDevice);

// Notification routes
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", removeNotification);

export default router;
