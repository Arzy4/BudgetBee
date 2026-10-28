import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { registerUser, loginUser } from "./auth.service.js";
import { z } from "zod/mini";

export async function registerController(
  req: Request,
  res: Response
): Promise<void> {
  // 1. Validate the incoming request
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
    // 2. Call the registration service
    const user = await registerUser(result.data);

    // 3. Return the created user
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    // 4. Handle duplicate emails
    if (
      error instanceof Error &&
      error.message === "EMAIL_ALREADY_EXISTS"
    ) {
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

    // 5. Handle unexpected errors
    console.error("Registration failed:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function loginController(
  req: Request,
  res: Response
): Promise<void> {
  // 1. Validate login data
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
    // 2. Call the login service
    const loginResult = await loginUser(result.data);

    // 3. Return the created user
    res.status(200).json({
      success: true,
      message: "User login successfully",
      data: loginResult,
    });
  } catch (error) {
    // 4. Handle incorrect credentials
    if (
      error instanceof Error &&
      error.message === "INVALID_CREDENTIALS"
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // 5. Handle unexpected errors
    console.error("Login failed:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
