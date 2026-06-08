import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import workoutRoutes from "./workout.routes";
import workoutPlanRoutes from "./workout-plan.routes";
import progressRoutes from "./progress.routes";
import blogRoutes from "./blog.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/workouts", workoutRoutes);
router.use("/workout-plans", workoutPlanRoutes);
router.use("/progress", progressRoutes);
router.use("/blog", blogRoutes);

export default router;
