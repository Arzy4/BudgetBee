import { z } from "zod/mini";
import { Prisma } from "../../generated/prisma/client.js";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/auth-request.js";
import {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  updateUserAvatar
} from "./user.service.js";
import { updateProfileSchema, changePasswordSchema } from "./user.schema.js";
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookieOptions,
} from "../auth/auth.cookie.js";

// Get User Controller
export async function getProfileController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  try {
    const user = await getUserProfile(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get profile failed:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Update User Controller
export async function updateProfileController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  // Validate request body
  const result = updateProfileSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: z.flattenError(result.error).fieldErrors,
    });
    return;
  }

  try {
    const updatedUser = await updateUserProfile(userId, result.data);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    // Handle user not found
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    console.error("Update profile failed:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Update Password
export async function changePasswordController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  const result = changePasswordSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: z.flattenError(result.error),
    });
    return;
  }

  try {
    await changeUserPassword(userId, result.data);

    res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      if (error.message === "INVALID_CURRENT_PASSWORD") {
        res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
        return;
      }

      if (error.message === "PASSWORD_UNCHANGED") {
        res.status(400).json({
          success: false,
          message: "New password must be different from the current password",
        });
        return;
      }
    }

    console.error("Change password failed:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Upload Profile Picture Controller
export async function uploadAvatarController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  if (!req.file) {
    res.status(400).json({
      success: false,
      message: "Profile picture is required",
    });
    return;
  }

  try {
    const updatedUser = await updateUserAvatar(userId, req.file);

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      if (error.message === "INVALID_IMAGE") {
        res.status(400).json({
          success: false,
          message: "Invalid image file",
        });
        return;
      }
    }

    console.error("Upload profile picture failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to upload profile picture",
    });
  }
}
