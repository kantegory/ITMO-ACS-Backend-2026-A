import { Request, Response } from "express";
import axios from "axios";
import { AppDataSource } from "../data-source";
import { Recipe } from "../models/Recipe";
import { Step } from "../models/Step";

const SOCIAL_SERVICE_URL = process.env.SOCIAL_SERVICE_URL || "http://localhost:3003";

async function getStats(recipeId: number): Promise<{ likes: number; comments: number }> {
    try {
        const response = await axios.get(`${SOCIAL_SERVICE_URL}/internal/recipes/${recipeId}/stats`);
        return { likes: response.data.likes_count, comments: response.data.comments_count };
    } catch (error) {
        return { likes: 0, comments: 0 };
    }
}

export const getRecipes = async (req: Request, res: Response) => {
    try {
        const recipes = await AppDataSource.getRepository(Recipe).find();
        const recipesWithStats = await Promise.all(recipes.map(async (recipe) => {
            const stats = await getStats(recipe.id);
            return { ...recipe, likes_count: stats.likes, comments_count: stats.comments };
        }));
        res.json(recipesWithStats);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch recipes" });
    }
};

export const getRecipe = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const recipe = await AppDataSource.getRepository(Recipe).findOne({ where: { id } });
        if (!recipe) return res.status(404).json({ message: "Recipe not found" });
        const steps = await AppDataSource.getRepository(Step).find({ where: { recipe_id: id }, order: { step_number: "ASC" } });
        const stats = await getStats(recipe.id);
        res.json({ ...recipe, steps, likes_count: stats.likes, comments_count: stats.comments });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch recipe" });
    }
};

export const createRecipe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { title, description, cooking_time, difficulty, category, image_url, video_url } = req.body;
        const recipe = AppDataSource.getRepository(Recipe).create({ title, description, cooking_time, difficulty, category, image_url, video_url, author_id: userId });
        await AppDataSource.getRepository(Recipe).save(recipe);
        res.status(201).json(recipe);
    } catch (error) {
        res.status(500).json({ message: "Failed to create recipe" });
    }
};

export const updateRecipe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.id as string);
        const recipe = await AppDataSource.getRepository(Recipe).findOne({ where: { id: recipeId } });
        if (!recipe) return res.status(404).json({ message: "Recipe not found" });
        if (recipe.author_id !== userId) return res.status(403).json({ message: "Not your recipe" });
        await AppDataSource.getRepository(Recipe).update(recipeId, req.body);
        res.json({ message: "Recipe updated" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update recipe" });
    }
};

export const deleteRecipe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.id as string);
        const recipe = await AppDataSource.getRepository(Recipe).findOne({ where: { id: recipeId } });
        if (!recipe) return res.status(404).json({ message: "Recipe not found" });
        if (recipe.author_id !== userId) return res.status(403).json({ message: "Not your recipe" });
        await AppDataSource.getRepository(Step).delete({ recipe_id: recipeId });
        await AppDataSource.getRepository(Recipe).delete(recipeId);
        res.json({ message: "Recipe deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete recipe" });
    }
};

export const getSteps = async (req: Request, res: Response) => {
    try {
        const recipeId = parseInt(req.params.recipeId as string);
        const steps = await AppDataSource.getRepository(Step).find({ where: { recipe_id: recipeId }, order: { step_number: "ASC" } });
        res.json(steps);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch steps" });
    }
};

export const createStep = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.recipeId as string);
        const { step_number, instruction } = req.body;
        const recipe = await AppDataSource.getRepository(Recipe).findOne({ where: { id: recipeId } });
        if (!recipe) return res.status(404).json({ message: "Recipe not found" });
        if (recipe.author_id !== userId) return res.status(403).json({ message: "Not your recipe" });
        const step = AppDataSource.getRepository(Step).create({ recipe_id: recipeId, step_number, instruction });
        await AppDataSource.getRepository(Step).save(step);
        res.status(201).json(step);
    } catch (error) {
        res.status(500).json({ message: "Failed to create step" });
    }
};
