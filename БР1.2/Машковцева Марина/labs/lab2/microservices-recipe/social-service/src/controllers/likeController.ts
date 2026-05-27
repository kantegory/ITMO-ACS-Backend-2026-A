import { Request, Response } from "express";
import axios from "axios";
import { AppDataSource } from "../data-source";
import { Like } from "../models/Like";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";
const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL || "http://localhost:3002";

async function checkUserExists(userId: number): Promise<boolean> {
    try {
        await axios.get(`${USER_SERVICE_URL}/internal/users/${userId}`);
        return true;
    } catch {
        return false;
    }
}

async function checkRecipeExists(recipeId: number): Promise<boolean> {
    try {
        await axios.get(`${RECIPE_SERVICE_URL}/internal/recipes/${recipeId}`);
        return true;
    } catch {
        return false;
    }
}

// GET /likes/recipe/:recipeId - получить количество лайков
export const getLikesCount = async (req: Request, res: Response) => {
    try {
        const recipeId = parseInt(req.params.recipeId as string);
        const count = await AppDataSource.getRepository(Like).count({
            where: { recipe_id: recipeId }
        });
        res.json({ likes_count: count });
    } catch (error) {
        res.status(500).json({ message: "Failed to get likes count" });
    }
};

// POST /likes/recipe/:recipeId - поставить лайк
export const addLike = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.recipeId as string);

        const userExists = await checkUserExists(userId);
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }

        const recipeExists = await checkRecipeExists(recipeId);
        if (!recipeExists) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        const existing = await AppDataSource.getRepository(Like).findOne({
            where: { user_id: userId, recipe_id: recipeId }
        });

        if (existing) {
            return res.status(400).json({ message: "Already liked" });
        }

        const like = AppDataSource.getRepository(Like).create({
            user_id: userId,
            recipe_id: recipeId
        });
        await AppDataSource.getRepository(Like).save(like);
        res.status(201).json({ message: "Liked" });
    } catch (error) {
        res.status(500).json({ message: "Failed to add like" });
    }
};

// DELETE /likes/recipe/:recipeId - убрать лайк
export const removeLike = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.recipeId as string);

        await AppDataSource.getRepository(Like).delete({
            user_id: userId,
            recipe_id: recipeId
        });
        res.json({ message: "Unliked" });
    } catch (error) {
        res.status(500).json({ message: "Failed to remove like" });
    }
};
