import { Router } from "express";
import { registerController, loginController, getProfileController, refreshController, logoutController } from "./auth.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/me", authenticateToken, getProfileController);

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);

export default router;
