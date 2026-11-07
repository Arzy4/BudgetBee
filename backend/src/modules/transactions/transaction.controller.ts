import { Prisma } from "../../generated/prisma/client.js";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/auth-request.js";
import { ZodError, z } from "zod";
import { createTransactionSchema, updateTransactionSchema, } from "./transaction.schema.js";
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  updateTransactionReceipt,
} from "./transaction.service.js";

// Get All Transactions Controller
export const getAllTransactionsController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    // Get the authenticated user
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    // Retrieve all transactions belonging to the user
    const transactions = await getAllTransactions(userId);

    // Return the transactions
    res.status(200).json({
      message: "Transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    // Handle unexpected errors
    console.error("Get all transactions error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get Transaction By ID Controller
export const getTransactionByIdController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    // Get the authenticated user
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    // Validate the transaction ID
    const transactionId = Number(req.params.id);

    if (!Number.isSafeInteger(transactionId) || transactionId <= 0) {
      res.status(400).json({
        message: "Invalid transaction ID",
      });
      return;
    }

    // Retrieve the transaction
    const transaction = await getTransactionById(userId, transactionId);

    // Return the transaction
    res.status(200).json({
      message: "Transaction retrieved successfully",
      data: transaction,
    });
  } catch (error) {
    // Handle transaction not found
    if (error instanceof Error && error.message === "Transaction not found") {
      res.status(404).json({
        message: "Transaction not found",
      });
      return;
    }

    // Handle unauthorized transaction access
    if (error instanceof Error && error.message === "Forbidden") {
      res.status(403).json({
        message: "Unauthorized access to this transaction",
      });
      return;
    }

    // Handle unexpected errors
    console.error("Get transaction by ID error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Create Transaction Controller
export const createTransactionController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    // Get the authenticated user
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    // Validate the request body
    const validatedData = createTransactionSchema.parse(req.body);

    // Create the transaction
    const transaction = await createTransaction(userId, validatedData);

    // Return the created transaction
    res.status(201).json({
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
      return;
    }

    // Handle category errors
    if (error instanceof Error) {
      if (error.message === "Category not found") {
        res.status(404).json({
          message: error.message,
        });
        return;
      }

      if (error.message === "Category type must match transaction type") {
        res.status(400).json({
          message: error.message,
        });
        return;
      }
    }

    // Handle unexpected errors
    console.error("Create transaction error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

 // Update Transaction By ID Controller
export const updateTransactionController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    // Get authenticated user ID
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    // Validate transaction ID
    const transactionId = Number(req.params.id);

    if (
      !Number.isSafeInteger(transactionId) ||
      transactionId <= 0
    ) {
      res.status(400).json({
        message: "Invalid transaction ID",
      });
      return;
    }

    // Validate request body
    const validatedData = updateTransactionSchema.parse(req.body);

    // Update transaction
    const transaction = await updateTransaction(
      userId,
      transactionId,
      validatedData,
    );

    // Return updated transaction
    res.status(200).json({
      message: "Transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
      return;
    }

    // Handle transaction not found
    if (
      error instanceof Error &&
      error.message === "Transaction not found"
    ) {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    // Handle unauthorized transaction access
    if (
      error instanceof Error &&
      error.message === "Forbidden"
    ) {
      res.status(403).json({
        message: "Unauthorized access to this transaction",
      });
      return;
    }

    // Handle category not found
    if (
      error instanceof Error &&
      error.message === "Category not found"
    ) {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    // Handle category type mismatch
    if (
      error instanceof Error &&
      error.message === "Category type must match transaction type"
    ) {
      res.status(400).json({
        message: error.message,
      });
      return;
    }

    // Handle unexpected errors
    console.error("Update transaction error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

 // Delete Transaction By ID Controller
export const deleteTransactionController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    // Get authenticated user ID
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    // Validate transaction ID
    const transactionId = Number(req.params.id);

    if (
      !Number.isSafeInteger(transactionId) ||
      transactionId <= 0
    ) {
      res.status(400).json({
        message: "Invalid transaction ID",
      });
      return;
    }

    // Delete transaction
    const deletedTransaction = await deleteTransaction(
      userId,
      transactionId,
    );

    // Return successful response
    res.status(200).json({
      message: "Transaction deleted successfully",
      data: deletedTransaction,
    });
  } catch (error) {
    // Handle transaction not found
    if (
      error instanceof Error &&
      error.message === "Transaction not found"
    ) {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    // Handle unauthorized transaction access
    if (
      error instanceof Error &&
      error.message === "Forbidden"
    ) {
      res.status(403).json({
        message: "Unauthorized access to this transaction",
      });
      return;
    }

    // Handle record deleted during the operation
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res.status(404).json({
        message: "Transaction not found",
      });
      return;
    }

    // Handle unexpected errors
    console.error("Delete transaction error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateTransactionReceiptController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    // Get authenticated user ID
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    // Validate transaction ID
    const transactionId = Number(req.params.id);

    if (!Number.isSafeInteger(transactionId) || transactionId <= 0) {
      res.status(400).json({
        message: "Invalid transaction ID",
      });
      return;
    }

    // Check uploaded receipt
    if (!req.file) {
      res.status(400).json({
        message: "Receipt image is required",
      });
      return;
    }

    // Update transaction receipt
    const updatedTransaction = await updateTransactionReceipt(
      userId,
      transactionId,
      req.file,
    );

    // Return updated transaction
    res.status(200).json({
      message: "Transaction receipt updated successfully",
      data: updatedTransaction,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "TRANSACTION_NOT_FOUND") {
        res.status(404).json({
          message: "Transaction not found",
        });
        return;
      }

      if (error.message === "INVALID_IMAGE") {
        res.status(400).json({
          message: "Only JPG, PNG, and WebP images are allowed",
        });
        return;
      }

      if (error.message === "IMAGE_TOO_LARGE") {
        res.status(400).json({
          message: "Receipt image cannot exceed 5 MB",
        });
        return;
      }
    }

    console.error("Transaction receipt upload failed:", error);

    res.status(500).json({
      message: "Unable to update transaction receipt",
    });
  }
};
