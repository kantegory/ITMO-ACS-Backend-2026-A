import { Response } from "express";
import { AppDataSource } from "../config/db";
import { Like } from "../entities/Like";
import { Comment } from "../entities/Comment";
import { Favorite } from "../entities/Favorite";
import axios from "axios";

const RECIPE_SERVICE = "http://recipe-service:3002";

export class InteractionController {
    static async toggleLike(req: any, res: Response) {
        const recipeId = parseInt(String(req.params.recipeId));
        const userId = req.userId;

        const check = await axios.get(`${RECIPE_SERVICE}/internal/recipes/${recipeId}/exists`);
        if (!check.data.exists) return res.status(404).json({ message: "Recipe not found" });

        const repo = AppDataSource.getRepository(Like);
        const existing = await repo.findOneBy({ userId, recipeId });

        if (existing) {
            await repo.remove(existing);
            return res.json({ message: "Unliked" });
        }
        const like = repo.create({ userId, recipeId });
        await repo.save(like);
        res.status(201).json(like);
    }

    static async addComment(req: any, res: Response) {
        const { content } = req.body;
        const recipeId = parseInt(String(req.params.recipeId));
        const comment = AppDataSource.getRepository(Comment).create({ content, userId: req.userId, recipeId });
        await AppDataSource.getRepository(Comment).save(comment);
        res.status(201).json(comment);
    }

    static async addFavorite(req: any, res: Response) {
        const recipeId = parseInt(String(req.params.recipeId));
        const fav = AppDataSource.getRepository(Favorite).create({ userId: req.userId, recipeId });
        await AppDataSource.getRepository(Favorite).save(fav);
        res.status(201).json(fav);
    }

    static async removeFavorite(req: any, res: Response) {
        const recipeId = parseInt(String(req.params.recipeId));
        await AppDataSource.getRepository(Favorite).delete({ userId: req.userId, recipeId });
        res.status(204).send();
    }
}