import { Router } from "express";
import { UserWorkoutController } from "../controller/UserWorkoutController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, UserWorkoutController.getUserWorkouts);
router.post("/", authenticate, UserWorkoutController.assignWorkout);
router.patch(
  "/:user_workout_id",
  authenticate,
  UserWorkoutController.updateUserWorkout,
);

export default router;
