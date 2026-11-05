import { Response } from "express"
import { AppDataSource } from "../data-source"
import { Follow } from "../entities/Follow"
import { User } from "../entities/User"
import { AuthRequest } from "../../../shared/auth"

const followRepository = AppDataSource.getRepository(Follow)
const userRepository = AppDataSource.getRepository(User)

export class FollowController {

    static async create(req: AuthRequest, res: Response) {

        if (Array.isArray(req.body) || (req.body && Object.keys(req.body).length > 0)) {
            return res.status(400).json({
                error: "BadRequest",
                message: "This request does not need a body"
            })
        }

        const followingId = Number(req.params.id)

        if (!/^[1-9]\d*$/.test(String(req.params.id)) || followingId > 2147483647) {
            return res.status(400).json({
                error: "BadRequest",
                message: "ID must be a positive integer"
            })
        }

        if (followingId === req.userId) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Cannot follow yourself"
            })
        }

        const follower = await userRepository.findOneBy({ id: req.userId })

        if (!follower) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "User not found"
            })
        }

        const following = await userRepository.findOneBy({ id: followingId })

        if (!following) {
            return res.status(404).json({
                error: "NotFound",
                message: "User not found"
            })
        }

        const follow = followRepository.create({
            follower_id: req.userId,
            following_id: followingId
        })

        await followRepository.save(follow)

        return res.status(201).json(follow)
    }

    static async delete(req: AuthRequest, res: Response) {

        if (Array.isArray(req.body) || (req.body && Object.keys(req.body).length > 0)) {
            return res.status(400).json({
                error: "BadRequest",
                message: "This request does not need a body"
            })
        }

        const followingId = Number(req.params.id)

        if (!/^[1-9]\d*$/.test(String(req.params.id)) || followingId > 2147483647) {
            return res.status(400).json({
                error: "BadRequest",
                message: "ID must be a positive integer"
            })
        }

        const follow = await followRepository.findOneBy({
            follower_id: req.userId,
            following_id: followingId
        })

        if (!follow) {
            return res.status(404).json({
                error: "NotFound",
                message: "Follow not found"
            })
        }

        await followRepository.remove(follow)

        return res.status(204).send()
    }
}
