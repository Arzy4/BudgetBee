import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import { uploadProfileImage } from "../../middlewares/upload.middleware.js";
import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import {
  getProfileController,
  updateProfileController,
  changePasswordController,
  uploadAvatarController,
} from "./user.controller.js";

const router = Router();

function handleAvatarUploadError(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (error instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Profile picture must not exceed 2 MB"
          : "Invalid image upload",
    });
    return;
  }

  if (error instanceof Error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
    return;
  }

  next(error);
}

// GET
router.get("/me", authenticateToken, getProfileController);

// PATCH
router.patch("/me", authenticateToken, updateProfileController);
router.patch("/me/password", authenticateToken, changePasswordController);
router.patch(
  "/me/avatar",
  authenticateToken,
  uploadProfileImage.single("avatar"),
  handleAvatarUploadError,
  uploadAvatarController,  
);

export default router;
