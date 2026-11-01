import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/auth-request.js";
import { ZodError } from "zod";
import { createCategorySchema } from "./category.schema.js";
import {
  createCategory,
  CategoryAlreadyExistsError,
} from "./category.service.js";

// Create Category Controller
export const createCategoryController = async (
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

    // Validate request body
    const validatedData = createCategorySchema.parse(req.body);

    // Create category
    const category = await createCategory(userId, validatedData);

    res.status(201).json({
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    // Zod validation error
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
      return;
    }

    // Duplicate category
    if (error instanceof CategoryAlreadyExistsError) {
      res.status(409).json({
        message: error.message,
      });
      return;
    }

    console.error("Create category error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
