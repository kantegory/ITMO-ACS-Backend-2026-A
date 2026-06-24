import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { Follow } from "../entities/Follow"

const followRepository =
    AppDataSource.getRepository(Follow)

export class FollowController {

    static async create(req: Request, res: Response) {

        const follow = followRepository.create({
            follower_id: req.body.follower_id,
            following_id: Number(req.params.id)
        })

        await followRepository.save(follow)

        return res.status(201).json(follow)
    }

    static async delete(req: Request, res: Response) {

        const follow = await followRepository.findOneBy({
            follower_id: req.body.follower_id,
            following_id: Number(req.params.id)
        })

        if (!follow) {
            return res.status(404).json({
                message: "Follow not found"
            })
        }

        await followRepository.remove(follow)

        return res.status(204).send()
    }
}