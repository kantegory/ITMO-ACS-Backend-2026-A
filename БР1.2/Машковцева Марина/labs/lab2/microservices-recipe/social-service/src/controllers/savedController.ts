import { Request, Response } from "express";
import axios from "axios";
import { AppDataSource } from "../data-source";
import { SavedRecipe } from "../models/SavedRecipe";

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

// GET /saved/me - получить сохранённые рецепты текущего пользователя
export const getSavedRecipes = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const saved = await AppDataSource.getRepository(SavedRecipe).find({
            where: { user_id: userId }
        });
        res.json(saved);
    } catch (error) {
        res.status(500).json({ message: "Failed to get saved recipes" });
    }
};

// POST /saved/recipe/:recipeId - сохранить рецепт
export const saveRecipe = async (req: Request, res: Response) => {
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

        const existing = await AppDataSource.getRepository(SavedRecipe).findOne({
            where: { user_id: userId, recipe_id: recipeId }
        });

        if (existing) {
            return res.status(400).json({ message: "Already saved" });
        }

        const saved = AppDataSource.getRepository(SavedRecipe).create({
            user_id: userId,
            recipe_id: recipeId
        });
        await AppDataSource.getRepository(SavedRecipe).save(saved);
        res.status(201).json({ message: "Recipe saved" });
    } catch (error) {
        res.status(500).json({ message: "Failed to save recipe" });
    }
};

// DELETE /saved/recipe/:recipeId - удалить из сохранённых
export const unsaveRecipe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.recipeId as string);

        await AppDataSource.getRepository(SavedRecipe).delete({
            user_id: userId,
            recipe_id: recipeId
        });
        res.json({ message: "Recipe unsaved" });
    } catch (error) {
        res.status(500).json({ message: "Failed to unsave recipe" });
    }
};
