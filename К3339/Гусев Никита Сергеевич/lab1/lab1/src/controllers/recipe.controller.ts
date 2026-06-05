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

    static async getOne(req: Request, res: Response) {

        const recipe = await recipeRepository.findOne({
            where: {
                id: Number(req.params.id)
            },
            relations: ["author"]
        })

        if (!recipe) {
            return res.status(404).json({
                message: "Recipe not found"
            })
        }

        return res.json(recipe)
    }

    static async create(req: Request, res: Response) {

        const recipe = recipeRepository.create(req.body)

        await recipeRepository.save(recipe)

        return res.status(201).json(recipe)
    }

    static async update(req: Request, res: Response) {

        const recipe = await recipeRepository.findOneBy({
            id: Number(req.params.id)
        })

        if (!recipe) {
            return res.status(404).json({
                message: "Recipe not found"
            })
        }

        recipeRepository.merge(recipe, req.body)

        await recipeRepository.save(recipe)

        return res.json(recipe)
    }

    static async delete(req: Request, res: Response) {

        const recipe = await recipeRepository.findOneBy({
            id: Number(req.params.id)
        })

        if (!recipe) {
            return res.status(404).json({
                message: "Recipe not found"
            })
        }

        await recipeRepository.remove(recipe)

        return res.status(204).send()
    }
}