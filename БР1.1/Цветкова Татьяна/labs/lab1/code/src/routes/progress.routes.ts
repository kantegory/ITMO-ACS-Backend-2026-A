import { Router } from "express";
import { ProgressController } from "../controllers/ProgressController";
import { authenticate } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authenticate);

router.get("/stats", asyncHandler(ProgressController.stats));
router.get("/", asyncHandler(ProgressController.list));
router.post("/", asyncHandler(ProgressController.create));
router.delete("/:id", asyncHandler(ProgressController.remove));

export default router;
