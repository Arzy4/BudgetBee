import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import { createCategoryController } from "./category.controller.js";

const router = Router();

// POST
router.post("/", authenticateToken, createCategoryController);

export default router;
