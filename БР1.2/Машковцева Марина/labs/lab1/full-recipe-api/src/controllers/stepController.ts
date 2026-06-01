import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Step } from "../models/Step";
import { Recipe } from "../models/Recipe";

// Получить все шаги рецепта
export const getSteps = async (req: Request, res: Response) => {
    try {
        const recipeId = parseInt(req.params.recipeId as string);
        const steps = await AppDataSource.getRepository(Step).find({
            where: { recipe_id: recipeId },
            order: { step_number: "ASC" }
        });
        res.json(steps);
    } catch (error) {
        res.status(500).json({ message: "Failed to get steps", error });
    }
};

// Добавить шаг к рецепту
export const createStep = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.recipeId as string);
        const { step_number, instruction } = req.body;
        
        // Проверяем, что пользователь — автор рецепта
        const recipe = await AppDataSource.getRepository(Recipe).findOne({ where: { id: recipeId } });
        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }
        if (recipe.author_id !== userId) {
            return res.status(403).json({ message: "Not your recipe" });
        }
        
        const step = AppDataSource.getRepository(Step).create({
            recipe_id: recipeId,
            step_number,
            instruction
        });
        
        await AppDataSource.getRepository(Step).save(step);
        res.status(201).json(step);
    } catch (error) {
        res.status(500).json({ message: "Failed to create step", error });
    }
};

// Обновить шаг
export const updateStep = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const stepId = parseInt(req.params.stepId as string);
        
        const step = await AppDataSource.getRepository(Step).findOne({ where: { id: stepId } });
        if (!step) {
            return res.status(404).json({ message: "Step not found" });
        }
        
        const recipe = await AppDataSource.getRepository(Recipe).findOne({ where: { id: step.recipe_id } });
        if (recipe?.author_id !== userId) {
            return res.status(403).json({ message: "Not your recipe" });
        }
        
        await AppDataSource.getRepository(Step).update(stepId, req.body);
        res.json({ message: "Step updated" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update step", error });
    }
};

// Удалить шаг
export const deleteStep = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const stepId = parseInt(req.params.stepId as string);
        
        const step = await AppDataSource.getRepository(Step).findOne({ where: { id: stepId } });
        if (!step) {
            return res.status(404).json({ message: "Step not found" });
        }
        
        const recipe = await AppDataSource.getRepository(Recipe).findOne({ where: { id: step.recipe_id } });
        if (recipe?.author_id !== userId) {
            return res.status(403).json({ message: "Not your recipe" });
        }
        
        await AppDataSource.getRepository(Step).delete(stepId);
        res.json({ message: "Step deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete step", error });
    }
};