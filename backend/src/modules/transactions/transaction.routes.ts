import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import { 
    createTransactionController, 
    getAllTransactionsController,
    getTransactionByIdController,
    updateTransactionController,
    deleteTransactionController 
} from "./transaction.controller.js";

const router = Router();

// GET
router.get("/", authenticateToken, getAllTransactionsController);
router.get("/:id", authenticateToken, getTransactionByIdController);

// POST
router.post("/", authenticateToken, createTransactionController);

// PATCH
router.patch("/:id", authenticateToken, updateTransactionController);

// DELETE
router.delete("/:id", authenticateToken, deleteTransactionController);

export default router;
