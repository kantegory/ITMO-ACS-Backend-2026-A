"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WorkoutController_1 = require("../controller/WorkoutController");
const router = (0, express_1.Router)();
router.get("/", WorkoutController_1.WorkoutController.getWorkouts);
router.get("/:workout_id", WorkoutController_1.WorkoutController.getWorkoutById);
router.get("/:workout_id/exercises", WorkoutController_1.WorkoutController.getWorkoutExercises);
exports.default = router;
