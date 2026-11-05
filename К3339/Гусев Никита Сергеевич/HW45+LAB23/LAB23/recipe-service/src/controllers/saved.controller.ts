import { Response } from "express"
import { AppDataSource } from "../data-source"
import { SavedRecipe } from "../entities/SavedRecipe"
import { Recipe } from "../entities/Recipe"
import { AuthRequest } from "../../../shared/auth"

const savedRepository = AppDataSource.getRepository(SavedRecipe)
const recipeRepository = AppDataSource.getRepository(Recipe)

export class SavedController {

    static async create(req: AuthRequest, res: Response) {

        if (Array.isArray(req.body) || (req.body && Object.keys(req.body).length > 0)) {
            return res.status(400).json({
                error: "BadRequest",
                message: "This request does not need a body"
            })
        }

        const recipeId = Number(req.params.id)

        if (!/^[1-9]\d*$/.test(String(req.params.id)) || recipeId > 2147483647) {
            return res.status(400).json({
                error: "BadRequest",
                message: "ID must be a positive integer"
            })
        }

        const recipe = await recipeRepository.findOneBy({ id: recipeId })

        if (!recipe) {
            return res.status(404).json({
                error: "NotFound",
                message: "Recipe not found"
            })
        }

        const saved = savedRepository.create({
            recipe_id: recipeId,
            user_id: req.userId
        })

        await savedRepository.save(saved)

        return res.status(201).json(saved)
    }

    static async delete(req: AuthRequest, res: Response) {

        if (Array.isArray(req.body) || (req.body && Object.keys(req.body).length > 0)) {
            return res.status(400).json({
                error: "BadRequest",
                message: "This request does not need a body"
            })
        }

        const recipeId = Number(req.params.id)

        if (!/^[1-9]\d*$/.test(String(req.params.id)) || recipeId > 2147483647) {
            return res.status(400).json({
                error: "BadRequest",
                message: "ID must be a positive integer"
            })
        }

        const saved = await savedRepository.findOneBy({
            recipe_id: recipeId,
            user_id: req.userId
        })

        if (!saved) {
            return res.status(404).json({
                error: "NotFound",
                message: "Record not found"
            })
        }

        await savedRepository.remove(saved)

        return res.status(204).send()
    }
}
