import { Request, Response } from "express";
import axios from "axios";
import { AppDataSource } from "../data-source";
import { Recipe } from "../models/Recipe";
import { Step } from "../models/Step";

const SOCIAL_SERVICE_URL = process.env.SOCIAL_SERVICE_URL || 'http://localhost:3003';

async function getStats(recipeId: number): Promise<{ likes: number; comments: number }> {
    try {
        const response = await axios.get(`${SOCIAL_SERVICE_URL}/internal/recipes/${recipeId}/stats`);
        return { likes: response.data.likes_count, comments: response.data.comments_count };
    } catch (error) {
        console.error(`Failed to fetch stats for recipe ${recipeId}:`, error);
        return { likes: 0, comments: 0 };
    }
}

// GET /recipes - список всех рецептов + статистика
export const getRecipes = async (req: Request, res: Response) => {
    try {
        const recipeRepo = AppDataSource.getRepository(Recipe);
        const recipes = await recipeRepo.find();

        const recipesWithStats = await Promise.all(recipes.map(async (recipe) => {
            const stats = await getStats(recipe.id);
            return {
                ...recipe,
                likes_count: stats.likes,
                comments_count: stats.comments,
            };
        }));

        res.json(recipesWithStats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch recipes" });
    }
};

// GET /recipes/:id – детали рецепта + статистика
export const getRecipe = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const recipeRepo = AppDataSource.getRepository(Recipe);
        const recipe = await recipeRepo.findOne({ where: { id } });

        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        const steps = await AppDataSource.getRepository(Step).find({
            where: { recipe_id: id },
            order: { step_number: "ASC" },
        });

        const stats = await getStats(recipe.id);

        res.json({
            ...recipe,
            steps,
            likes_count: stats.likes,
            comments_count: stats.comments,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch recipe" });
    }
};

// POST /recipes – создать рецепт
export const createRecipe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { title, description, cooking_time, difficulty, category, image_url, video_url } = req.body;

        const recipeRepo = AppDataSource.getRepository(Recipe);
        const recipe = recipeRepo.create({
            title,
            description,
            cooking_time,
            difficulty,
            category,
            image_url,
            video_url,
            author_id: userId,
        });
        await recipeRepo.save(recipe);

        res.status(201).json(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create recipe" });
    }
};

// PUT /recipes/:id – обновить рецепт (только автор)
export const updateRecipe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.id as string);
        const recipeRepo = AppDataSource.getRepository(Recipe);
        const recipe = await recipeRepo.findOne({ where: { id: recipeId } });

        if (!recipe) return res.status(404).json({ message: "Recipe not found" });
        if (recipe.author_id !== userId) return res.status(403).json({ message: "Not your recipe" });

        await recipeRepo.update(recipeId, req.body);
        res.json({ message: "Recipe updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update recipe" });
    }
};

// DELETE /recipes/:id – удалить рецепт (только автор)
export const deleteRecipe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.id as string);
        const recipeRepo = AppDataSource.getRepository(Recipe);
        const recipe = await recipeRepo.findOne({ where: { id: recipeId } });

        if (!recipe) return res.status(404).json({ message: "Recipe not found" });
        if (recipe.author_id !== userId) return res.status(403).json({ message: "Not your recipe" });

        await AppDataSource.getRepository(Step).delete({ recipe_id: recipeId });
        await recipeRepo.delete(recipeId);
        res.json({ message: "Recipe deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete recipe" });
    }
};

// GET /recipes/:recipeId/steps – получить шаги
export const getSteps = async (req: Request, res: Response) => {
    try {
        const recipeId = parseInt(req.params.recipeId as string);
        const steps = await AppDataSource.getRepository(Step).find({
            where: { recipe_id: recipeId },
            order: { step_number: "ASC" },
        });
        res.json(steps);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch steps" });
    }
};

// POST /recipes/:recipeId/steps – добавить шаг (только автор)
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
        console.error(error);
        res.status(500).json({ message: "Failed to create step" });
    }
};