import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import {
  createCategoryController,
  getCategoriesController,
  updateCategoryController,
  deleteCategoryController
} from "./category.controller.js";

const router = Router();

// GET
router.get("/", authenticateToken, getCategoriesController);

// POST
router.post("/", authenticateToken, createCategoryController);

// PATCH
router.patch("/:id", authenticateToken, updateCategoryController);

// DELETE
router.delete("/:id", authenticateToken, deleteCategoryController);

export default router;
