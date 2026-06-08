import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { Recipe } from "../entities/Recipe";
import { AuthRequest } from "../midla/auth";
import { Like } from "typeorm";

export class RecipeController {
    private static repo = AppDataSource.getRepository(Recipe);

    static async create(req: AuthRequest, res: Response) {
        try {
            const { title, description, dish_type, difficulty } = req.body;
            
            if (!title) return res.status(400).json({ message: "Title is required" });

            // Создаем объект рецепта и ПРИВЯЗЫВАЕМ автора через req.userId
            const recipe = this.repo.create({
                title,
                description,
                dish_type,
                difficulty,
                author: { id: req.userId } as any
            });

            await this.repo.save(recipe);
            res.status(201).json(recipe);
        } catch (error) {
            console.error("CREATE ERROR:", error);
            res.status(500).json({ message: "Error creating recipe" });
        }
    }

    static async getAll(req: Request, res: Response) {
        const items = await this.repo.find({ relations: { author: true } });
        res.json({ items });
    }

    static async search(req: Request, res: Response) {
        const { query, dish_type, difficulty } = req.query;
        const where: any = {};
        if (typeof query === 'string') where.title = Like(`%${query}%`);
        if (typeof dish_type === 'string') where.dish_type = dish_type;
        if (typeof difficulty === 'string') where.difficulty = difficulty;

        const [items, total] = await this.repo.findAndCount({ 
            where, 
            relations: { author: true } 
        });
        res.json({ items, total });
    }

    static async getOne(req: Request, res: Response) {
        const id = parseInt(String(req.params.id));
        const item = await this.repo.findOne({ 
            where: { id }, 
            relations: { author: true } 
        });
        if (!item) return res.status(404).json({ message: "Not found" });
        res.json(item);
    }

    static async update(req: AuthRequest, res: Response) {
        const id = parseInt(String(req.params.id));
        const recipe = await this.repo.findOne({ where: { id }, relations: { author: true } });
        if (!recipe) return res.status(404).json({ message: "Not found" });
        if (recipe.author.id !== req.userId) return res.status(403).json({ message: "Forbidden" });

        this.repo.merge(recipe, req.body);
        await this.repo.save(recipe);
        res.json(recipe);
    }

    static async delete(req: AuthRequest, res: Response) {
        const id = parseInt(String(req.params.id));
        const recipe = await this.repo.findOne({ where: { id }, relations: { author: true } });
        if (!recipe) return res.status(404).json({ message: "Not found" });
        if (recipe.author.id !== req.userId) return res.status(403).json({ message: "Forbidden" });

        await this.repo.remove(recipe);
        res.status(204).send();
    }
}