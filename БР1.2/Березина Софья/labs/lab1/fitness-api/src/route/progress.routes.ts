import { Router } from "express";
import { ProgressController } from "../controller/ProgressController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, ProgressController.getProgress);
router.post("/", authenticate, ProgressController.addProgress);
router.get("/stats", authenticate, ProgressController.getStats);

export default router;
