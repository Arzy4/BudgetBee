import type { Request, Response } from "express";
import { ZodError } from "zod";
import { createTransactionSchema } from "./transaction.schema.js";
import { createTransaction } from "./transaction.service.js";

// Create Transaction Controller
export const createTransactionController = async (
  req: Request,
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
