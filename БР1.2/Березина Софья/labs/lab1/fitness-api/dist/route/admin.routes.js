"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdminController_1 = require("../controller/AdminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.requireAdmin);
// Workouts
router.post("/workouts", AdminController_1.AdminController.createWorkout);
router.put("/workouts/:workout_id", AdminController_1.AdminController.updateWorkout);
router.delete("/workouts/:workout_id", AdminController_1.AdminController.deleteWorkout);
// Exercises
router.post("/exercises", AdminController_1.AdminController.createExercise);
router.put("/exercises/:exercise_id", AdminController_1.AdminController.updateExercise);
router.delete("/exercises/:exercise_id", AdminController_1.AdminController.deleteExercise);
// Blog
router.post("/blog/posts", AdminController_1.AdminController.createBlogPost);
router.put("/blog/posts/:post_id", AdminController_1.AdminController.updateBlogPost);
router.delete("/blog/posts/:post_id", AdminController_1.AdminController.deleteBlogPost);
exports.default = router;
