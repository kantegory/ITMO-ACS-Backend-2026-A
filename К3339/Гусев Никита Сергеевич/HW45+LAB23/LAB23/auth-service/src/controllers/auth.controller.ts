import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { User } from "../entities/User"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { getChannel } from "../shared/rabbitmq"
import { JWT_SECRET } from "../../../shared/config"
import { HttpError } from "../../../shared/http"

const userRepository = AppDataSource.getRepository(User)

export class AuthController {

    static async register(req: Request, res: Response) {

        if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Body must be a JSON object"
            })
        }

        const allowedFields = ["username", "email", "password"]
        const hasExtraFields = Object.keys(req.body).some(key => !allowedFields.includes(key))

        if (hasExtraFields) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Unknown fields in request body"
            })
        }

        const { username, email, password } = req.body

        if (
            typeof username !== "string" ||
            username.trim().length < 3 ||
            username.trim().length > 64
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Username must contain 3 to 64 characters"
            })
        }

        if (
            typeof email !== "string" ||
            email.trim().length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Invalid email"
            })
        }

        if (
            typeof password !== "string" ||
            password.length < 6 ||
            Buffer.byteLength(password) > 72
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Invalid password length"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const channel = await getChannel()

        const user = userRepository.create({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword
        })

        await AppDataSource.transaction(async manager => {
            await manager.save(user)

            const event = {
                type: "USER_REGISTERED",
                payload: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            }

            try {
                channel.sendToQueue(
                    "user_events",
                    Buffer.from(JSON.stringify(event)),
                    { persistent: true }
                )

                await channel.waitForConfirms()
            } catch {
                throw new HttpError(503, "Message broker unavailable")
            }
        })

        return res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email
        })
    }

    static async login(req: Request, res: Response) {

        if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Body must be a JSON object"
            })
        }

        const allowedFields = ["email", "password"]
        const hasExtraFields = Object.keys(req.body).some(key => !allowedFields.includes(key))

        if (hasExtraFields) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Unknown fields in request body"
            })
        }

        const { email, password } = req.body

        if (
            typeof email !== "string" ||
            email.trim().length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Invalid email"
            })
        }

        if (
            typeof password !== "string" ||
            password.length < 1 ||
            Buffer.byteLength(password) > 72
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Invalid password length"
            })
        }

        const user = await userRepository.findOneBy({
            email: email.trim().toLowerCase()
        })

        if (!user) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Invalid email or password"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Invalid email or password"
            })
        }

        const token = jwt.sign(
            { id: user.id },
            JWT_SECRET,
            {
                algorithm: "HS256",
                expiresIn: "24h"
            }
        )

        return res.json({ token })
    }
}
