import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { Like } from "../entities/Like"

const likeRepository =
    AppDataSource.getRepository(Like)

export class LikeController {

    static async create(req: Request, res: Response) {

        const like = likeRepository.create({
            recipe_id: Number(req.params.id),
            user_id: req.body.user_id
        })

        await likeRepository.save(like)

        return res.status(201).json(like)
    }

    static async delete(req: Request, res: Response) {

        const like = await likeRepository.findOneBy({
            recipe_id: Number(req.params.id),
            user_id: req.body.user_id
        })

        if (!like) {
            return res.status(404).json({
                message: "Like not found"
            })
        }

        await likeRepository.remove(like)

        return res.status(204).send()
    }
}