import { z } from "zod/mini";
import { Prisma } from "../../generated/prisma/client.js";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/auth-request.js";
import { createAccountSchema, updateAccountSchema } from "./account.schema.js";
import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount
} from "./account.service.js";

// Get All Accounts Controller
export async function getAccountsController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    const accounts = await getAccounts(userId);

    res.status(200).json({
      success: true,
      message: "Accounts retrieved successfully",
      data: accounts,
    });
  } catch (error) {
    console.error("Get accounts error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Get Account by ID Controller
export async function getAccountByIdController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    // Validate account ID
    const accountId = Number(req.params.id);

    if (!Number.isSafeInteger(accountId) || accountId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid account ID",
      });
      return;
    }

    // Retrieve account with ownership validation
    const account = await getAccountById(userId, accountId);

    if (!account) {
      res.status(403).json({
        success: false,
        message: "Access denied, you can only access your own account",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Account retrieved successfully",
      data: account,
    });
  } catch (error) {
    console.error("Get account by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Create Account Controller
export async function createAccountController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    // Get authenticated user ID from JWT middleware
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    // Validate request body
    const validation = createAccountSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid account data",
        errors: z.flattenError(validation.error).fieldErrors,
      });
      return;
    }

    // Create account using validated data
    const account = await createAccount(userId, validation.data);

    // Return successful response
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: account,
    });
  } catch (error) {
    console.error("Create account error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Update Account by ID Controller
export async function updateAccountController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    const accountId = Number(req.params.id);

    if (!Number.isSafeInteger(accountId) || accountId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid account ID",
      });
      return;
    }

    const validation = updateAccountSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid account data",
        errors: z.flattenError(validation.error).fieldErrors,
      });
      return;
    }

    const account = await updateAccount(userId, accountId, validation.data);

    res.status(200).json({
      success: true,
      message: "Account updated successfully",
      data: account,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res.status(404).json({
        success: false,
        message: "Account not found",
      });
      return;
    }

    console.error("Update account error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Delete Account Controller
export async function deleteAccountController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    const accountId = Number(req.params.id);

    if (
      !Number.isSafeInteger(accountId) ||
      accountId <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid account ID",
      });
      return;
    }

    const result = await deleteAccount(userId, accountId);

    if (result.status === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Account not found",
      });
      return;
    }

    if (result.status === "HAS_TRANSACTIONS") {
      res.status(409).json({
        success: false,
        message:
          "Cannot delete an account that contains transactions",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
