import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { User } from "../entities/User"
import bcrypt from "bcrypt"

const userRepository = AppDataSource.getRepository(User)

export class AuthController {

    static async register(req: Request, res: Response) {

        const { username, email, password } = req.body

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = userRepository.create({
            username,
            email,
            password: hashedPassword
        })

        await userRepository.save(user)

        return res.status(201).json(user)
    }
}