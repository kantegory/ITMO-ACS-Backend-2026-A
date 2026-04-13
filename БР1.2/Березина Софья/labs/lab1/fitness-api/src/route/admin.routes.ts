import { Router } from "express";
import { AdminController } from "../controller/AdminController";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// Workouts
router.post("/workouts", AdminController.createWorkout);
router.put("/workouts/:workout_id", AdminController.updateWorkout);
router.delete("/workouts/:workout_id", AdminController.deleteWorkout);

// Exercises
router.post("/exercises", AdminController.createExercise);
router.put("/exercises/:exercise_id", AdminController.updateExercise);
router.delete("/exercises/:exercise_id", AdminController.deleteExercise);

// Blog
router.post("/blog/posts", AdminController.createBlogPost);
router.put("/blog/posts/:post_id", AdminController.updateBlogPost);
router.delete("/blog/posts/:post_id", AdminController.deleteBlogPost);

export default router;
