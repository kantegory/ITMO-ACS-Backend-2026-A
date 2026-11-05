import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { User } from "../entities/User"
import { AuthRequest } from "../../../shared/auth"

const userRepository = AppDataSource.getRepository(User)

export async function getMe(req: AuthRequest, res: Response) {

    const user = await userRepository.findOneBy({
        id: req.userId
    })

    if (!user) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "User not found"
        })
    }

    return res.json({
        id: user.id,
        username: user.username,
        email: user.email
    })
}

export async function getInternalUser(req: Request, res: Response) {

    const id = Number(req.params.id)

    if (!/^[1-9]\d*$/.test(String(req.params.id)) || id > 2147483647) {
        return res.status(400).json({
            error: "BadRequest",
            message: "ID must be a positive integer"
        })
    }

    const user = await userRepository.findOneBy({ id })

    if (!user) {
        return res.status(404).json({
            error: "NotFound",
            message: "User not found"
        })
    }

    return res.json({
        id: user.id,
        username: user.username,
        email: user.email
    })
}
