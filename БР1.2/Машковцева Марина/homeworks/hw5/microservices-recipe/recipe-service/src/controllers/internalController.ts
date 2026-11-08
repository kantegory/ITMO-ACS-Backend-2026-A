import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Recipe } from "../models/Recipe";

export const getRecipeById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const recipe = await AppDataSource.getRepository(Recipe).findOne({ where: { id }, select: ["id", "title", "author_id"] });
        if (!recipe) return res.status(404).json({ message: "Recipe not found" });
        res.json(recipe);
    } catch (error) {
        res.status(500).json({ message: "Failed to get recipe" });
    }
};
