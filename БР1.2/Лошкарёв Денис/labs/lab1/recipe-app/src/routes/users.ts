import { Router } from "express";
import { authMidla } from "../midla/auth";
import { AppDataSource } from "../config/db";
import { Favorite } from "../entities/Favorite";

const router = Router();

// Добавить в избранное
router.post("/favorites/:recipeId", authMidla, async (req: any, res) => {
    // #swagger.tags = ['User']
    // #swagger.summary = 'Добавить рецепт в избранное'
    // #swagger.security = [{ "bearerAuth": [] }]
    try {
        const repo = AppDataSource.getRepository(Favorite);
        const fav = repo.create({
            user: { id: req.userId },
            recipe: { id: parseInt(req.params.recipeId) }
        });
        await repo.save(fav);
        res.status(201).json(fav);
    } catch (e) {
        res.status(400).json({ message: "Error adding to favorites" });
    }
});

// Удалить из избранного
router.delete("/favorites/:recipeId", authMidla, async (req: any, res) => {
    // #swagger.tags = ['User']
    // #swagger.summary = 'Удалить рецепт из избранного'
    // #swagger.security = [{ "bearerAuth": [] }]
    try {
        const repo = AppDataSource.getRepository(Favorite);
        await repo.delete({
            user: { id: req.userId },
            recipe: { id: parseInt(req.params.recipeId) }
        });
        res.status(204).send();
    } catch (e) {
        res.status(400).json({ message: "Error removing from favorites" });
    }
});

export default router;