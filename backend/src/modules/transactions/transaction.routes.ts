import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import { createTransactionController } from "./transaction.controller.js";

const router = Router();

// POST
router.post("/", authenticateToken, createTransactionController);

export default router;
