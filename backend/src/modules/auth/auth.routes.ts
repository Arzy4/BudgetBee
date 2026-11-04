import { Router } from "express";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  requestPasswordResetController,
  verifyPasswordResetController,
  confirmPasswordResetController
} from "./auth.controller.js";

const router = Router();

// POST
router.post("/register", registerController);
router.post("/login", loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
router.post("/password-reset/request", requestPasswordResetController);
router.post("/password-reset/verify", verifyPasswordResetController);
router.post("/password-reset/confirm", confirmPasswordResetController);

export default router;
