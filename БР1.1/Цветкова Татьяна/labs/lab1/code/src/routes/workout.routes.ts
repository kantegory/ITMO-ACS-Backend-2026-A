import { Router } from "express";
import { WorkoutController } from "../controllers/WorkoutController";
import { authenticate, authorize } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { UserRole } from "../entities/User";

const router = Router();

router.get("/categories", asyncHandler(WorkoutController.listCategories));
router.post(
  "/categories",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.TRAINER),
  asyncHandler(WorkoutController.createCategory),
);

router.get("/", asyncHandler(WorkoutController.list));
router.get("/:id", asyncHandler(WorkoutController.getOne));
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.TRAINER),
  asyncHandler(WorkoutController.create),
);
router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.TRAINER),
  asyncHandler(WorkoutController.update),
);
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.TRAINER),
  asyncHandler(WorkoutController.remove),
);

export default router;
