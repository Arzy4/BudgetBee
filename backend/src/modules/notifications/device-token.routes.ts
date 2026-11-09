import { Router } from "express";
import {
  registerDevice,
  unregisterDevice,
} from "./device-token.controller.js";
import { authenticateToken } from "../../middlewares/auth.middleware.js";

const router = Router();

// Register Android FCM token
router.post("/register", authenticateToken, registerDevice);

// Unregister Android FCM token
router.delete("/unregister", authenticateToken, unregisterDevice);

export default router;