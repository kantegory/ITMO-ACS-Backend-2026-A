import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { User } from "../entities/User"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

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

    static async login(req: Request, res: Response) {

        const { email, password } = req.body

        const user = await userRepository.findOneBy({
            email
        })

        if (!user) {
            return res.status(401).json({
                message: "Invalid email"
            })
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        )

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid password"
            })
        }

        const token = jwt.sign(
            { id: user.id },
            "secret",
            { expiresIn: "24h" }
        )

        return res.json({
            token
        })
    }
}