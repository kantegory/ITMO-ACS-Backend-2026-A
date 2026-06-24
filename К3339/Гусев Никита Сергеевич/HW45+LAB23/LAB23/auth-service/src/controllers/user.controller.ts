import { Response } from "express"
import { AppDataSource } from "../data-source"
import { User } from "../entities/User"
import { AuthRequest } from "../middlewares/auth.middleware"

export const getMe = async (
    req: AuthRequest,
    res: Response
) => {

    const userRepository = AppDataSource.getRepository(User)

    const user = await userRepository.findOneBy({
        id: req.userId
    })

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        })
    }

    res.json(user)
}