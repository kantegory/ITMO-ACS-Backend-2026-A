"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const data_source_1 = require("./data-source");
const auth_routes_1 = __importDefault(require("./route/auth.routes"));
const user_routes_1 = __importDefault(require("./route/user.routes"));
const progress_routes_1 = __importDefault(require("./route/progress.routes"));
const workout_routes_1 = __importDefault(require("./route/workout.routes"));
const userWorkout_routes_1 = __importDefault(require("./route/userWorkout.routes"));
const blog_routes_1 = __importDefault(require("./route/blog.routes"));
const admin_routes_1 = __importDefault(require("./route/admin.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/users", user_routes_1.default);
app.use("/api/v1/progress", progress_routes_1.default);
app.use("/api/v1/workouts", workout_routes_1.default);
app.use("/api/v1/user/workouts", userWorkout_routes_1.default);
app.use("/api/v1/blog", blog_routes_1.default);
app.use("/api/v1/admin", admin_routes_1.default);
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
// Start server
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})
    .catch((error) => {
    console.error("Database connection error:", error);
});
