import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/me", authMiddleware, UserController.getMe);
router.patch("/me", authMiddleware, UserController.updateMe);
router.put("/me/password", authMiddleware, UserController.changePassword);

export default router;
