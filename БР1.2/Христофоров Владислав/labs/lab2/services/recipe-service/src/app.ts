import "reflect-metadata";
import express from "express";
import cors from "cors";
import { useExpressServer } from "routing-controllers";
import dataSource from "./config/data-source";
import { InternalRecipeController } from "./controllers/internal.controller";
import { RecipeController } from "./controllers/recipe.controller";
import { DictionaryController } from "./controllers/dictionary.controller";
import { AdminController } from "./controllers/admin.controller";
import { SavedRecipeController } from "./controllers/saved-recipe.controller";

const app = express();
const PORT = process.env.APP_PORT || 8002;

app.use(cors());

useExpressServer(app, {
    routePrefix: process.env.APP_API_PREFIX || "/api/v1",
    controllers: [RecipeController, DictionaryController, AdminController, SavedRecipeController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true,
});

useExpressServer(app, {
    routePrefix: "",
    controllers: [InternalRecipeController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true,
});

const start = async () => {
    try {
        await dataSource.initialize();
        console.log("✅ Recipe Database connected!");
        app.listen(PORT, () => {
            console.log(
                `🚀 Recipe Service is running on http://localhost:${PORT}`,
            );
        });
    } catch (err) {
        console.error("Database connection error:", err);
    }
};

start();
