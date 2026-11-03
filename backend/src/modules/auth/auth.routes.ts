import { Router } from "express";
import { registerController, loginController, refreshController, logoutController } from "./auth.controller.js";

const router = Router();

// POST
router.post("/register", registerController);
router.post("/login", loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);

export default router;
