import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Recipe } from "../models/Recipe";
import { Like } from "../models/Like";
import { Comment } from "../models/Comment";
import { SavedRecipe } from "../models/SavedRecipe";

export const getRecipes = async (req: Request, res: Response) => {
    try {
        const { sortBy, category, author, difficulty } = req.query;
        
        const recipeRepo = AppDataSource.getRepository(Recipe);
        let recipes = await recipeRepo.find({ relations: ["author", "steps"] });
        
        // Добавляем количество лайков и комментариев
        let result = await Promise.all(recipes.map(async (recipe) => {
            const likesCount = await AppDataSource.getRepository(Like).count({ where: { recipe_id: recipe.id } });
            const commentsCount = await AppDataSource.getRepository(Comment).count({ where: { recipe_id: recipe.id } });
            return { ...recipe, likes_count: likesCount, comments_count: commentsCount };
        }));
        
        // Фильтрация по категории (типу блюда)
        if (category) {
            result = result.filter(r => r.category === category);
        }
        
        // Фильтрация по автору
        if (author) {
            result = result.filter(r => r.author_id === parseInt(author as string));
        }
        
        // Фильтрация по сложности
        if (difficulty) {
            result = result.filter(r => r.difficulty === difficulty);
        }
        
        // Сортировка
        if (sortBy === "likes") {
            result.sort((a, b) => b.likes_count - a.likes_count);
        } else if (sortBy === "date") {
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sortBy === "difficulty") {
            const order: { [key: string]: number } = { easy: 1, medium: 2, hard: 3 };
            result.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed to get recipes", error });
    }
};

export const getRecipe = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const recipe = await AppDataSource.getRepository(Recipe).findOne({
            where: { id },
            relations: ["author", "comments", "comments.user"]
        });
        
        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }
        
        const likesCount = await AppDataSource.getRepository(Like).count({ where: { recipe_id: recipe.id } });
        
        res.json({
            ...recipe,
            likes_count: likesCount,
            comments_count: recipe.comments?.length || 0
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to get recipe", error });
    }
};

export const createRecipe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { title, description, cooking_time, difficulty } = req.body;
        
        const recipe = AppDataSource.getRepository(Recipe).create({
            title,
            description,
            cooking_time,
            difficulty,
            author_id: userId
        });
        
        await AppDataSource.getRepository(Recipe).save(recipe);
        res.status(201).json(recipe);
    } catch (error) {
        res.status(500).json({ message: "Failed to create recipe", error });
    }
};

export const updateRecipe = async (req: Request, res: Response) => {
    try {
        const recipeId = parseInt(req.params.id as string);
        const userId = (req as any).userId;
        
        const recipe = await AppDataSource.getRepository(Recipe).findOne({ where: { id: recipeId } });
        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }
        if (recipe.author_id !== userId) {
            return res.status(403).json({ message: "Not your recipe" });
        }
        
        await AppDataSource.getRepository(Recipe).update(recipeId, req.body);
        res.json({ message: "Recipe updated" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update recipe", error });
    }
};

export const deleteRecipe = async (req: Request, res: Response) => {
    try {
        const recipeId = parseInt(req.params.id as string);
        const userId = (req as any).userId;
        
        const recipe = await AppDataSource.getRepository(Recipe).findOne({ where: { id: recipeId } });
        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }
        if (recipe.author_id !== userId) {
            return res.status(403).json({ message: "Not your recipe" });
        }
        
        await AppDataSource.getRepository(Recipe).delete(recipeId);
        res.json({ message: "Recipe deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete recipe", error });
    }
};

export const likeRecipe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.id as string);
        
        const existing = await AppDataSource.getRepository(Like).findOne({
            where: { user_id: userId, recipe_id: recipeId }
        });
        
        if (existing) {
            return res.status(400).json({ message: "Already liked" });
        }
        
        const like = AppDataSource.getRepository(Like).create({ user_id: userId, recipe_id: recipeId });
        await AppDataSource.getRepository(Like).save(like);
        res.status(201).json({ message: "Liked" });
    } catch (error) {
        res.status(500).json({ message: "Failed to like", error });
    }
};

export const unlikeRecipe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.id as string);
        
        await AppDataSource.getRepository(Like).delete({ user_id: userId, recipe_id: recipeId });
        res.json({ message: "Unliked" });
    } catch (error) {
        res.status(500).json({ message: "Failed to unlike", error });
    }
};