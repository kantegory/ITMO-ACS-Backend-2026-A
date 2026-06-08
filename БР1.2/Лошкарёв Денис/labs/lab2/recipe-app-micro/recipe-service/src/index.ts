import "reflect-metadata";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { AppDataSource } from "./config/db";
import { RecipeController } from "./controllers/RecipeController";
import { authMidla } from "./midla/auth";

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api-docs-json', (req, res) => {
    const swaggerPath = path.join(process.cwd(), 'swagger-output.json');
    if (fs.existsSync(swaggerPath)) res.sendFile(swaggerPath);
    else res.status(404).json({ error: "Not found" });
});

app.get("/recipes", RecipeController.getAll);
app.get("/recipes/search", RecipeController.search);
app.get("/recipes/:id", RecipeController.getOne);

app.post("/recipes", authMidla, (req, res) => {
    // #swagger.tags = ['Recipes']
    // #swagger.security = [{ "bearerAuth": [] }] 
    /* #swagger.parameters['body'] = {
            in: 'body',
            description: 'Данные нового рецепта',
            schema: {
                $title: "Паста Карбонара",
                $description: "Классический рецепт",
                dish_type: "dinner",
                difficulty: "medium"
            }
    } */
    RecipeController.create(req, res);
});app.put("/recipes/:id", authMidla, RecipeController.update);
app.delete("/recipes/:id", authMidla, RecipeController.delete);

app.get("/internal/recipes/:id/exists", RecipeController.exists);

const PORT = 3002;
AppDataSource.initialize().then(() => {
    app.listen(PORT, () => console.log(`✅ Recipe Service Connected`));
});