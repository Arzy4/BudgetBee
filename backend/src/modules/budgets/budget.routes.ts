import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import {
  createBudgetController,
  getBudgetsController,
  updateBudgetController,
  deleteBudgetController
} from "./budget.controller.js";

const router = Router();

// GET
router.get("/", authenticateToken, getBudgetsController);

// POST
router.post("/", authenticateToken, createBudgetController);

// PATCH
router.patch("/:id", authenticateToken, updateBudgetController);

// DELETE
router.delete("/:id", authenticateToken, deleteBudgetController);

export default router;
