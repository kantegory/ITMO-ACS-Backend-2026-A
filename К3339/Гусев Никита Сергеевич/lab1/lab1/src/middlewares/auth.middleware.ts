import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

export interface AuthRequest extends Request {
    userId?: number
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {

    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).json({
            message: "No token"
        })
    }

    const token = authHeader.split(" ")[1]

    try {

        const decoded = jwt.verify(
            token,
            "secret"
        ) as { id: number }

        req.userId = decoded.id

        next()

    } catch {

        return res.status(401).json({
            message: "Invalid token"
        })
    }
}