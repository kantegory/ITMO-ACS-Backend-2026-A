import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { Comment } from "../entities/Comment"

const commentRepository = AppDataSource.getRepository(Comment)

export class CommentController {

    static async create(req: Request, res: Response) {

        const comment = commentRepository.create(req.body)

        await commentRepository.save(comment)

        return res.status(201).json(comment)
    }
}