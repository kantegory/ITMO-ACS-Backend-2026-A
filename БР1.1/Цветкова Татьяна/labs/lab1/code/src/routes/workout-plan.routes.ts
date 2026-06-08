import { Router } from "express";
import { WorkoutPlanController } from "../controllers/WorkoutPlanController";
import { authenticate } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(WorkoutPlanController.list));
router.post("/", asyncHandler(WorkoutPlanController.create));
router.get("/:id", asyncHandler(WorkoutPlanController.getOne));
router.patch("/:id", asyncHandler(WorkoutPlanController.update));
router.delete("/:id", asyncHandler(WorkoutPlanController.remove));

router.post("/:id/items", asyncHandler(WorkoutPlanController.addItem));
router.delete(
  "/:id/items/:itemId",
  asyncHandler(WorkoutPlanController.removeItem),
);
router.patch(
  "/:id/items/:itemId/complete",
  asyncHandler(WorkoutPlanController.completeItem),
);

export default router;
