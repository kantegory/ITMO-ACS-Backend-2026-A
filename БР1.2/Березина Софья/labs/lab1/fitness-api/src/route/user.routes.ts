import { Router } from "express";
import { UserController } from "../controller/UserController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/me", authenticate, UserController.getMyProfile);
router.patch("/me/profile", authenticate, UserController.updateProfile);
router.put("/me/password", authenticate, UserController.changePassword);

export default router;
