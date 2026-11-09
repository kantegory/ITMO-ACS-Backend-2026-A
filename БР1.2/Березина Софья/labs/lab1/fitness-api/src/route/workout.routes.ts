import { Router } from "express";
import { WorkoutController } from "../controller/WorkoutController";

const router = Router();

router.get("/", WorkoutController.getWorkouts);
router.get("/:workout_id", WorkoutController.getWorkoutById);
router.get("/:workout_id/exercises", WorkoutController.getWorkoutExercises);

export default router;
