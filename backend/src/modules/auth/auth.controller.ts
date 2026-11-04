import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { z } from "zod/mini";
import type { AuthenticatedRequest } from "../../types/auth-request.js";
import { requestPasswordReset, verifyPasswordResetCode, confirmPasswordReset } from "./password-reset.service.js";
import {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
  clearRefreshCookieOptions,
} from "./auth.cookie.js";

import { registerSchema, loginSchema } from "./auth.schema.js";

import {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
} from "./auth.service.js";

const passwordResetRequestSchema = z.object({
  email: z.email(),
});

const passwordResetVerifySchema = z.object({
  requestId: z.uuid(),
  code: z.string().check(
    z.regex(/^\d{6}$/, "Verification code must contain exactly 6 digits")
  ),
});

const passwordResetConfirmSchema = z.object({
  resetToken: z.string().check(
    z.regex(/^[a-fA-F0-9]{64}$/, "Invalid reset token format"),
  ),
  newPassword: z.string().check(
    z.minLength(8, "Password must contain at least 8 characters"),
  ),
});

// Register Contoller
export async function registerController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  // Validate the incoming request
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: z.flattenError(result.error).fieldErrors,
    });
    return;
  }

  try {
    // Call the registration service
    const user = await registerUser(result.data);

    // Return the created user
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    // Handle duplicate emails
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
      return;
    }

    // Also handle database unique-constraint conflicts
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
      return;
    }

    // Handle unexpected errors
    console.error("Registration failed:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Login Controller
export async function loginController(
  req: Request,
  res: Response,
): Promise<void> {
  // Validate login data
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: z.flattenError(result.error).fieldErrors,
    });
    return;
  }

  try {
    // Call the login service
    const loginResult = await loginUser(result.data);

    // Store refresh token in an HTTP-only cookie
    res.cookie(
      REFRESH_COOKIE_NAME,
      loginResult.refreshToken,
      refreshCookieOptions,
    );

    // Return the created user
    res.status(200).json({
      success: true,
      message: "User login successfully",
      data: {
        accessToken: loginResult.accessToken,
        user: loginResult.user,
      },
    });
  } catch (error) {
    // Handle incorrect credentials
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Handle unexpected errors
    console.error("Login failed:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// REFRESH TOKEN CONTROLLER
export async function refreshController(
  req: Request,
  res: Response,
): Promise<void> {
  // Read refresh token from HTTP-only cookie
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  // Check whether refresh token exists
  if (typeof refreshToken !== "string" || !refreshToken) {
    res.status(401).json({
      success: false,
      message: "Refresh token is missing",
    });
    return;
  }

  try {
    // Validate and rotate refresh token
    const tokens = await refreshUserToken({
      refreshToken,
    });

    // Store the newly rotated refresh token
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);

    // Return only the new access token
    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "INVALID_REFRESH_TOKEN" ||
        error.message === "REFRESH_TOKEN_REUSE_DETECTED")
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
      return;
    }

    console.error("Refresh token error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// LOGOUT CONTROLLER
export async function logoutController(
  req: Request,
  res: Response,
): Promise<void> {
  // Read refresh token from cookie
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  // Check whether refresh token exists
  if (typeof refreshToken !== "string" || !refreshToken) {
    res.status(401).json({
      success: false,
      message: "Refresh token is missing",
    });
    return;
  }

  try {
    // Revoke refresh session in database
    await logoutUser({ refreshToken });

    // Remove refresh token cookie
    res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions);

    // Return successful response
    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_REFRESH_TOKEN") {
      res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions);

      res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
      return;
    }

    console.error("Logout error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Request Password-Reset Controller
export async function requestPasswordResetController(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = passwordResetRequestSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
    return;
  }

  try {
    const requestId = await requestPasswordReset(validation.data.email);

    res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a verification code will be sent.",
      requestId,
    });
  } catch (error) {
    console.error("Password reset request failed:", error);

    // Return a generic response to avoid exposing account existence.
    res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a verification code will be sent.",
    });
  }
}

// Verify Password-Reset Controller
export async function verifyPasswordResetController(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = passwordResetVerifySchema.safeParse(
    req.body,
  );

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid request ID or verification code format.",
    });
    return;
  }

  try {
    const resetToken = await verifyPasswordResetCode(
      validation.data.requestId,
      validation.data.code,
    );

    res.status(200).json({
      success: true,
      message: "Verification successful.",
      resetToken,
    });
  } catch {
    res.status(400).json({
      success: false,
      message: "Invalid or expired verification code.",
    });
  }
}

// Verify Password-Reset Controller
export async function confirmPasswordResetController(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = passwordResetConfirmSchema.safeParse(
    req.body,
  );

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid reset token or password format.",
    });
    return;
  }

  try {
    await confirmPasswordReset(
      validation.data.resetToken,
      validation.data.newPassword,
    );

    res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Password reset confirmation failed:", error);

    res.status(400).json({
      success: false,
      message: "Invalid or expired password reset token.",
    });
  }
}
