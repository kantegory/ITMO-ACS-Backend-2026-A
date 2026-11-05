import { Response } from "express"
import { AppDataSource } from "../data-source"
import { Like } from "../entities/Like"
import { Recipe } from "../entities/Recipe"
import { AuthRequest } from "../../../shared/auth"

const likeRepository = AppDataSource.getRepository(Like)
const recipeRepository = AppDataSource.getRepository(Recipe)

export class LikeController {

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

        const like = likeRepository.create({
            recipe_id: recipeId,
            user_id: req.userId
        })

        await likeRepository.save(like)

        return res.status(201).json(like)
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

        const like = await likeRepository.findOneBy({
            recipe_id: recipeId,
            user_id: req.userId
        })

        if (!like) {
            return res.status(404).json({
                error: "NotFound",
                message: "Record not found"
            })
        }

        await likeRepository.remove(like)

        return res.status(204).send()
    }
}
