import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { Comment } from "../entities/Comment"
import { AuthRequest } from "../../../shared/auth"
import { internalRequest } from "../../../shared/internal"

const commentRepository = AppDataSource.getRepository(Comment)

export class CommentController {

    static async create(req: AuthRequest, res: Response) {

        if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Body must be a JSON object"
            })
        }

        const allowedFields = ["text"]
        const hasExtraFields = Object.keys(req.body).some(key => !allowedFields.includes(key))

        if (hasExtraFields) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Unknown fields in request body"
            })
        }

        const { text } = req.body

        if (typeof text !== "string" || text.trim().length < 1 || text.trim().length > 5000) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Comment must contain 1 to 5000 characters"
            })
        }

        const recipeId = Number(req.params.id)

        if (!/^[1-9]\d*$/.test(String(req.params.id)) || recipeId > 2147483647) {
            return res.status(400).json({
                error: "BadRequest",
                message: "ID must be a positive integer"
            })
        }

        await internalRequest("recipe", "/internal/recipes/" + recipeId)

        const comment = commentRepository.create({
            text: text.trim(),
            recipe_id: recipeId,
            user_id: req.userId
        })

        await commentRepository.save(comment)

        return res.status(201).json(comment)
    }

    static async getByRecipe(req: Request, res: Response) {

        const recipeId = Number(req.params.id)

        if (!/^[1-9]\d*$/.test(String(req.params.id)) || recipeId > 2147483647) {
            return res.status(400).json({
                error: "BadRequest",
                message: "ID must be a positive integer"
            })
        }

        await internalRequest("recipe", "/internal/recipes/" + recipeId)

        const comments = await commentRepository.find({
            where: { recipe_id: recipeId },
            order: { id: "ASC" }
        })

        return res.json(comments)
    }

    static async getInternal(req: Request, res: Response) {

        const recipeId = Number(req.params.id)

        if (!/^[1-9]\d*$/.test(String(req.params.id)) || recipeId > 2147483647) {
            return res.status(400).json({
                error: "BadRequest",
                message: "ID must be a positive integer"
            })
        }

        const comments = await commentRepository.find({
            where: { recipe_id: recipeId },
            order: { id: "ASC" }
        })

        return res.json(comments)
    }

    static async deleteByRecipe(req: Request, res: Response) {

        const recipeId = Number(req.params.id)

        if (!/^[1-9]\d*$/.test(String(req.params.id)) || recipeId > 2147483647) {
            return res.status(400).json({
                error: "BadRequest",
                message: "ID must be a positive integer"
            })
        }

        await commentRepository.delete({ recipe_id: recipeId })

        return res.status(204).send()
    }
}
