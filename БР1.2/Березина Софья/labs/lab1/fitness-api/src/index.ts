import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";

import authRoutes from "./route/auth.routes";
import userRoutes from "./route/user.routes";
import progressRoutes from "./route/progress.routes";
import workoutRoutes from "./route/workout.routes";
import userWorkoutRoutes from "./route/userWorkout.routes";
import blogRoutes from "./route/blog.routes";
import adminRoutes from "./route/admin.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/progress", progressRoutes);
app.use("/api/v1/workouts", workoutRoutes);
app.use("/api/v1/user/workouts", userWorkoutRoutes);
app.use("/api/v1/blog", blogRoutes);
app.use("/api/v1/admin", adminRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });
