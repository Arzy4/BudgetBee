import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/auth-request.js";
import { ZodError } from "zod";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./category.schema.js";
import {
  createCategory,
  CategoryAlreadyExistsError,
  getCategoriesByUser,
  updateCategory,
  CategoryNotFoundError,
  CategoryInUseError,
  deleteCategory,
  CategoryDeletionConflictError,
} from "./category.service.js";

// Get Categories by User Controller
export async function getCategoriesController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const categories = await getCategoriesByUser(userId);

    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Error retrieving categories:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve categories",
    });
  }
}

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

// Update Category Controller
export const updateCategoryController = async (
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

    // Validate category ID
    const categoryId = Number(req.params.id);

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      res.status(400).json({
        message: "Invalid category ID",
      });
      return;
    }

    // Validate request body
    const validatedData = updateCategorySchema.parse(req.body);

    // Update category
    const category = await updateCategory(userId, categoryId, validatedData);

    res.status(200).json({
      message: "Category updated successfully",
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

    // Category not found or not owned by user
    if (error instanceof CategoryNotFoundError) {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    // Category already exists
    if (error instanceof CategoryAlreadyExistsError) {
      res.status(409).json({
        message: error.message,
      });
      return;
    }

    // Category used by existing transactions
    if (error instanceof CategoryInUseError) {
      res.status(409).json({
        message: error.message,
      });
      return;
    }

    console.error("Update category error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Delete Category Controller
export const deleteCategoryController = async (
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

    // Validate category ID
    const categoryId = Number(req.params.id);

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      res.status(400).json({
        message: "Invalid category ID",
      });
      return;
    }

    // Delete category
    await deleteCategory(userId, categoryId);

    res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    // Category not found or belongs to another user
    if (error instanceof CategoryNotFoundError) {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    // Category is used by transactions or budgets
    if (error instanceof CategoryDeletionConflictError) {
      res.status(409).json({
        message: error.message,
      });
      return;
    }

    console.error("Delete category error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
