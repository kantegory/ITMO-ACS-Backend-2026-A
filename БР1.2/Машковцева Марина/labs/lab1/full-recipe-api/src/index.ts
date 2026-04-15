import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import { authMiddleware } from "./middleware/auth";

// Auth
import { register, login, getProfile, updateProfile } from "./controllers/authController";

// Recipes
import { getRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe, likeRecipe, unlikeRecipe } from "./controllers/recipeController";

// Comments
import { getComments, createComment, deleteComment } from "./controllers/commentController";

// Users
import { getUser, subscribe, unsubscribe, getSubscriptions, saveRecipe, unsaveRecipe, getSavedRecipes, getUserRecipes } from "./controllers/userController";

// Steps
import { getSteps, createStep, updateStep, deleteStep } from "./controllers/stepController";

const app = express();
app.use(express.json());

// ПУБЛИЧНЫЕ РОУТЫ 
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);
app.get("/api/recipes", getRecipes);
app.get("/api/recipes/:id", getRecipe);
app.get("/api/recipes/:recipeId/steps", getSteps);

// ЗАЩИЩЕННЫЕ РОУТЫ 
app.use("/api", authMiddleware);

// Profile
app.get("/api/auth/me", getProfile);
app.put("/api/auth/me", updateProfile);

// Users
app.get("/api/users/:id", getUser);
app.get("/api/users/:id/recipes", getUserRecipes); 
app.post("/api/users/:id/subscribe", subscribe);
app.delete("/api/users/:id/subscribe", unsubscribe);
app.get("/api/users/me/subscriptions", getSubscriptions);

// Recipes (защищённые действия)
app.post("/api/recipes", createRecipe);
app.put("/api/recipes/:id", updateRecipe);
app.delete("/api/recipes/:id", deleteRecipe);
app.post("/api/recipes/:id/likes", likeRecipe);
app.delete("/api/recipes/:id/likes", unlikeRecipe);
app.post("/api/recipes/:id/save", saveRecipe);
app.delete("/api/recipes/:id/save", unsaveRecipe);
app.get("/api/recipes/me/saved", getSavedRecipes);

// Comments
app.get("/api/recipes/:recipeId/comments", getComments);
app.post("/api/recipes/:recipeId/comments", createComment);
app.delete("/api/comments/:commentId", deleteComment);

// Steps
app.post("/api/recipes/:recipeId/steps", createStep);
app.put("/api/steps/:stepId", updateStep);
app.delete("/api/steps/:stepId", deleteStep);

// Запуск
AppDataSource.initialize().then(() => {
    console.log("Database connected!");
    app.listen(8000, () => {
        console.log("Server running on http://localhost:8000");
        console.log("\nВсе эндпоинты готовы!");
    });
}).catch(error => {
    console.error("Database error:", error);
});