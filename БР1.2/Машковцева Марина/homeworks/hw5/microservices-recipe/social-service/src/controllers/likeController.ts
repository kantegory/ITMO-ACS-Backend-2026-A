import { Request, Response } from "express";
import axios from "axios";
import { AppDataSource } from "../data-source";
import { Like } from "../models/Like";
import { User } from "../models/User"; 

async function checkUserExists(userId: number): Promise<boolean> {
    try {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({ id: userId });
        return user !== null;
    } catch {
        return false;
    }
}

async function checkRecipeExists(recipeId: number): Promise<boolean> {
    try {
        const response = await fetch(`http://localhost:3002/internal/recipes/${recipeId}`);
        return response.ok;
    } catch {
        return false;
    }
}

// GET /likes/recipe/:recipeId - получить количество лайков
export const getLikesCount = async (req: Request, res: Response) => {
    try {
        const recipeId = parseInt(req.params.recipeId as string);
        const likeRepo = AppDataSource.getRepository(Like);
        const count = await likeRepo.count({
            where: { recipe_id: recipeId }
        });
        res.json({ likes_count: count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get likes count" });
    }
};

// POST /likes/recipe/:recipeId - поставить лайк
export const addLike = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.recipeId as string);

        // Проверяем существование пользователя в локальной БД
        const userExists = await checkUserExists(userId);
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }

        // Проверяем существование рецепта через Recipe Service
        const recipeExists = await checkRecipeExists(recipeId);
        if (!recipeExists) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        const likeRepo = AppDataSource.getRepository(Like);
        const existing = await likeRepo.findOne({
            where: { user_id: userId, recipe_id: recipeId }
        });

        if (existing) {
            return res.status(400).json({ message: "Already liked" });
        }

        const like = likeRepo.create({
            user_id: userId,
            recipe_id: recipeId
        });
        await likeRepo.save(like);
        res.status(201).json({ message: "Liked" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to add like" });
    }
};

// DELETE /likes/recipe/:recipeId - убрать лайк
export const removeLike = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.recipeId as string);

        const likeRepo = AppDataSource.getRepository(Like);
        await likeRepo.delete({
            user_id: userId,
            recipe_id: recipeId
        });
        res.json({ message: "Unliked" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to remove like" });
    }
};
