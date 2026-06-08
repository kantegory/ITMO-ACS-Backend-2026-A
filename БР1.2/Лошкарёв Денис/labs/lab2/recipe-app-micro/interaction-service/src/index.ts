import "reflect-metadata";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { AppDataSource } from "./config/db";
import { InteractionController } from "./controllers/InteractionController";
import { authMidla } from "./midla/auth";

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api-docs-json', (req, res) => {
    const swaggerPath = path.join(process.cwd(), 'swagger-output.json');
    if (fs.existsSync(swaggerPath)) res.sendFile(swaggerPath);
    else res.status(404).json({ error: "Not found" });
});

app.post("/likes/:recipeId", authMidla, InteractionController.toggleLike);
app.post("/comments/:recipeId", authMidla, InteractionController.addComment);

// Эти роуты вызываются напрямую через /favorites
app.post("/favorites/:recipeId", authMidla, InteractionController.addFavorite);
app.delete("/favorites/:recipeId", authMidla, InteractionController.removeFavorite);

const PORT = 3003;
AppDataSource.initialize().then(() => {
    app.listen(PORT, () => console.log(`✅ Interaction Service on ${PORT}`));
});