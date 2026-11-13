import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Like } from "../models/Like";
import { Comment } from "../models/Comment";

export const getRecipeStats = async (req: Request, res: Response) => {
    try {
        const recipeId = parseInt(req.params.id as string);
        const likesCount = await AppDataSource.getRepository(Like).count({
            where: { recipe_id: recipeId }
        });
        const commentsCount = await AppDataSource.getRepository(Comment).count({
            where: { recipe_id: recipeId }
        });
        res.json({ likes_count: likesCount, comments_count: commentsCount });
    } catch (error) {
        res.status(500).json({ message: "Failed to get stats" });
    }
};
