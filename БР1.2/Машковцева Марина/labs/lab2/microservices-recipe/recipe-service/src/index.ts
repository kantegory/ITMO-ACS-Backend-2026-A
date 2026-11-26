import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { authMiddleware } from "./middleware/auth";
import { getRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe, getSteps, createStep } from "./controllers/recipeController";
import { getRecipeById } from "./controllers/internalController";

dotenv.config();
const app = express();
app.use(express.json());

app.get("/api/recipes", getRecipes);
app.get("/api/recipes/:id", getRecipe);
app.get("/api/recipes/:recipeId/steps", getSteps);
app.get("/internal/recipes/:id", getRecipeById);

app.post("/api/recipes", authMiddleware, createRecipe);
app.put("/api/recipes/:id", authMiddleware, updateRecipe);
app.delete("/api/recipes/:id", authMiddleware, deleteRecipe);
app.post("/api/recipes/:recipeId/steps", authMiddleware, createStep);

AppDataSource.initialize().then(() => {
    const port = process.env.PORT || 3002;
    app.listen(port, () => console.log(`Recipe Service running on port ${port}`));
}).catch(err => console.error("DB error:", err));
