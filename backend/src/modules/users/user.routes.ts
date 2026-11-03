import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import {
  getProfileController,
  updateProfileController,
  changePasswordController,
} from "./user.controller.js";

const router = Router();

// GET
router.get("/me", authenticateToken, getProfileController);

// PATCH
router.patch("/me", authenticateToken, updateProfileController);
router.patch("/me/password", authenticateToken, changePasswordController);

export default router;
