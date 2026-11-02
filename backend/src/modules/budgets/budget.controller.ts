import { z } from "zod";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/auth-request.js";
import {
  budgetIdParamSchema,
  createBudgetSchema,
  getBudgetsQuerySchema,
  updateBudgetSchema,
} from "./budget.schema.js";

import {
  BudgetCategoryNotFoundError,
  BudgetAlreadyExistsError,
  BudgetNotFoundError,
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget
} from "./budget.service.js";

// Get Budgets Controller
export async function getBudgetsController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    // Validate query parameters
    const validation = getBudgetsQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid budget query parameters",
        errors: z.flattenError(validation.error).fieldErrors,
      });
      return;
    }

    // Get authenticated user
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    // Retrieve monthly budgets
    const budgets = await getBudgets(userId, validation.data);

    res.status(200).json({
      success: true,
      message: "Budgets retrieved successfully",
      data: budgets,
    });
  } catch (error) {
    console.error("Get budgets error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Create Budget Controller
export async function createBudgetController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    // Validate request body
    const validation = createBudgetSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid budget data",
        errors: z.flattenError(validation.error).fieldErrors,
      });
      return;
    }

    // Get authenticated user
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    // Create budget
    const budget = await createBudget(userId, validation.data);

    res.status(201).json({
      success: true,
      message: "Budget created successfully",
      data: budget,
    });
  } catch (error) {
    // Category not found or not owned by user
    if (error instanceof BudgetCategoryNotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    // Duplicate monthly budget
    if (error instanceof BudgetAlreadyExistsError) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    // Unexpected error
    console.error("Create budget error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Update Budget Controller
export async function updateBudgetController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    // Validate budget ID
    const paramsValidation = budgetIdParamSchema.safeParse(req.params);

    if (!paramsValidation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid budget ID",
        errors: z.flattenError(paramsValidation.error).fieldErrors,
      });
      return;
    }

    // Validate request body
    const bodyValidation = updateBudgetSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid budget data",
        errors: z.flattenError(bodyValidation.error).fieldErrors,
      });
      return;
    }

    // Get authenticated user
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    // Update budget
    const budget = await updateBudget(
      userId,
      paramsValidation.data.id,
      bodyValidation.data,
    );

    res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      data: budget,
    });
  } catch (error) {
    if (error instanceof BudgetCategoryNotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof BudgetAlreadyExistsError) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Update budget error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Delete Budget Controller
export async function deleteBudgetController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    // Validate budget ID
    const paramsValidation = budgetIdParamSchema.safeParse(req.params)

    if (!paramsValidation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid budget ID',
        errors: paramsValidation.error.flatten(),
      })
      return
    }

    // Get authenticated user
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
      return
    }

    // Delete budget
    const result = await deleteBudget(
      userId,
      paramsValidation.data.id,
    )

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
      data: result,
    })
  } catch (error) {
    // Budget doesn't exist or belongs to another user
    if (error instanceof BudgetNotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message,
      })
      return
    }

    // Unexpected error
    console.error('Delete budget error:', error)

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}
