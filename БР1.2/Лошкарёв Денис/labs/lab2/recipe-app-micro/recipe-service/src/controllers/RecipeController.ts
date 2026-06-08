import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { Recipe } from "../entities/Recipe";
import { AuthClient } from "../services/AuthClient";
import { Like as TypeORMLike } from "typeorm";

export class RecipeController {
    private static repo = AppDataSource.getRepository(Recipe);

    private static standardRelations = {
        steps: true,
        recipe_ingredients: {
            ingredient: true
        }
    };

    static async getAll(req: Request, res: Response) {
        try {
            const items = await RecipeController.repo.find({
                relations: RecipeController.standardRelations
            });
            res.json({ items });
        } catch (e: any) {
            console.error("!!! DATABASE ERROR:", e);
            res.status(500).json({ message: "Error", error: e.message });
        }
    }

    static async search(req: Request, res: Response) {
        const { query, dish_type, difficulty } = req.query;
        const where: any = {};
        if (typeof query === 'string') where.title = TypeORMLike(`%${query}%`);
        if (typeof dish_type === 'string') where.dish_type = dish_type;
        if (typeof difficulty === 'string') where.difficulty = difficulty;

        try {
            const [items, total] = await RecipeController.repo.findAndCount({ 
                where,
                relations: RecipeController.standardRelations 
            });
            res.json({ items, total });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async getOne(req: Request, res: Response) {
        try {
            const id = parseInt(String(req.params.id));
            const recipe = await RecipeController.repo.findOne({ 
                where: { id },
                relations: RecipeController.standardRelations
            });

            if (!recipe) return res.status(404).json({ message: "Not found" });
            const author = await AuthClient.getUser(recipe.authorId);
            res.json({ ...recipe, author });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async create(req: any, res: Response) {
        try {
            const recipe = RecipeController.repo.create({
                ...req.body,
                authorId: req.userId 
            });
            await RecipeController.repo.save(recipe);
            res.status(201).json(recipe);
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    }

    static async update(req: any, res: Response) {
        try {
            const id = parseInt(String(req.params.id));
            const recipe = await RecipeController.repo.findOneBy({ id });

            if (!recipe) return res.status(404).json({ message: "Not found" });
            if (recipe.authorId !== req.userId) return res.status(403).json({ message: "Forbidden" });

            RecipeController.repo.merge(recipe, req.body);
            await RecipeController.repo.save(recipe);
            res.json(recipe);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async delete(req: any, res: Response) {
        try {
            const id = parseInt(String(req.params.id));
            const recipe = await RecipeController.repo.findOneBy({ id });

            if (!recipe) return res.status(404).json({ message: "Not found" });
            if (recipe.authorId !== req.userId) return res.status(403).json({ message: "Forbidden" });

            await RecipeController.repo.remove(recipe);
            res.status(204).send();
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async exists(req: Request, res: Response) {
        const id = parseInt(String(req.params.id));
        const count = await RecipeController.repo.countBy({ id });
        res.json({ exists: count > 0 });
    }
}