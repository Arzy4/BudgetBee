import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod/mini";
import type { AuthenticatedRequest } from "../../types/auth-request.js";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "./auth.cookie.js";

import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from "./auth.schema.js";

import {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
} from "./auth.service.js";

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

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
export async function logoutController(req: Request, res: Response) {
  const result = logoutSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: z.flattenError(result.error),
    });
  }

  try {
    const response = await logoutUser(result.data);

    return res.status(200).json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_REFRESH_TOKEN") {
      return res.status(401).json({
        message: "Invalid or expired refresh token",
      });
    }

    console.error("Logout error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
