import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import {
  createAccountController,
  getAccountsController,
  getAccountByIdController,
  updateAccountController,
  deleteAccountController
} from "./account.controller.js";

const router = Router();

// GET
router.get("/", authenticateToken, getAccountsController);
router.get("/:id", authenticateToken, getAccountByIdController);

// POST
router.post("/", authenticateToken, createAccountController);

// PATCH
router.patch("/:id", authenticateToken, updateAccountController);

// DELETE
router.delete("/:id", authenticateToken, deleteAccountController);

export default router;
