import { Router } from "express";
import { AuthController, UserController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const auth = Router();
auth.post("/register", AuthController.register);
auth.post("/login", AuthController.login);
auth.post("/refresh", AuthController.refresh);
auth.post("/logout", AuthController.logout);
router.use("/auth", auth);

router.get("/me", authMiddleware, UserController.me);

export default router;
