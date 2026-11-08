import { Request, Response } from "express";
import axios from "axios";
import { AppDataSource } from "../data-source";
import { SavedRecipe } from "../models/SavedRecipe";
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

// GET /saved/me - получить сохранённые рецепты текущего пользователя
export const getSavedRecipes = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const savedRepo = AppDataSource.getRepository(SavedRecipe);
        const saved = await savedRepo.find({
            where: { user_id: userId }
        });
        res.json(saved);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get saved recipes" });
    }
};

// POST /saved/recipe/:recipeId - сохранить рецепт
export const saveRecipe = async (req: Request, res: Response) => {
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

        const savedRepo = AppDataSource.getRepository(SavedRecipe);
        const existing = await savedRepo.findOne({
            where: { user_id: userId, recipe_id: recipeId }
        });

        if (existing) {
            return res.status(400).json({ message: "Already saved" });
        }

        const saved = savedRepo.create({
            user_id: userId,
            recipe_id: recipeId
        });
        await savedRepo.save(saved);
        res.status(201).json({ message: "Recipe saved" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to save recipe" });
    }
};

// DELETE /saved/recipe/:recipeId - удалить из сохранённых
export const unsaveRecipe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.recipeId as string);

        const savedRepo = AppDataSource.getRepository(SavedRecipe);
        await savedRepo.delete({
            user_id: userId,
            recipe_id: recipeId
        });
        res.json({ message: "Recipe unsaved" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to unsave recipe" });
    }
};
