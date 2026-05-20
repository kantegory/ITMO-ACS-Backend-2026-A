import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authenticate } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authenticate);

router.get("/me", asyncHandler(UserController.me));
router.patch("/me", asyncHandler(UserController.updateMe));
router.delete("/me", asyncHandler(UserController.deleteMe));

export default router;
