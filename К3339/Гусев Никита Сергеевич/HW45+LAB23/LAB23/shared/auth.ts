import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "./config"
import { HttpError } from "./http"
import { internalRequest } from "./internal"

export interface AuthRequest extends Request {
    userId?: number
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {

    const authHeader = req.headers.authorization
    const match = /^Bearer ([^ ]+)$/i.exec(authHeader || "")

    if (!match) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Bearer token required"
        })
    }

    const token = match[1]

    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ["HS256"]
        })

        if (
            typeof decoded === "string" ||
            !Number.isInteger(decoded.id) ||
            decoded.id < 1 ||
            decoded.id > 2147483647
        ) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Invalid user ID in token"
            })
        }

        req.userId = decoded.id
        next()
    } catch {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Invalid or expired token"
        })
    }
}

export async function requireUser(req: AuthRequest, res: Response, next: NextFunction) {

    try {
        await internalRequest("auth", "/internal/users/" + req.userId)
        next()
    } catch (error) {
        if (error instanceof HttpError && error.status === 404) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "User not found"
            })
        }

        next(error)
    }
}
