import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { Recipe } from "../entities/Recipe"

const recipeRepository = AppDataSource.getRepository(Recipe)

export class RecipeController {

    static async getAll(req: Request, res: Response) {

        const recipes = await recipeRepository.find({
            relations: ["author"]
        })

        return res.json(recipes)
    }

    static async create(req: Request, res: Response) {

        const recipe = recipeRepository.create(req.body)

        await recipeRepository.save(recipe)

        return res.status(201).json(recipe)
    }
}