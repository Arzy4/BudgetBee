import { Router, ErrorRequestHandler } from "express";
import multer from "multer";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import {
  createTransactionController,
  getAllTransactionsController,
  getTransactionByIdController,
  updateTransactionController,
  deleteTransactionController,
  updateTransactionReceiptController,
} from "./transaction.controller.js";

const router = Router();

// Receipt upload configuration
const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const handleReceiptUploadError: ErrorRequestHandler = (
  error,
  _req,
  res,
  next,
) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Receipt image cannot exceed 5 MB"
          : "Invalid receipt upload",
    });
    return;
  }

  next(error);
};

// GET
router.get("/", authenticateToken, getAllTransactionsController);
router.get("/:id", authenticateToken, getTransactionByIdController);

// POST
router.post("/", authenticateToken, createTransactionController);

// PATCH
router.patch("/:id", authenticateToken, updateTransactionController);
router.patch(
  "/:id/receipt",
  authenticateToken,
  receiptUpload.single("receipt"),
  handleReceiptUploadError,
  updateTransactionReceiptController,
);

// DELETE
router.delete("/:id", authenticateToken, deleteTransactionController);

export default router;
