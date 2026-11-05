import { ErrorRequestHandler, Request, Response, NextFunction } from "express"

export class HttpError extends Error {

    constructor(public status: number, message: string) {
        super(message)
    }
}

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {

    if (res.headersSent) {
        return next(error)
    }

    let status = 500
    let message = "Internal server error"

    if (error instanceof HttpError) {
        status = error.status
        message = error.message
    }

    const code = error.driverError?.code || error.code

    if (code === "23505") {
        status = 409
        message = "Record already exists"
    }

    if (code === "23503") {
        status = 404
        message = "Related record not found"
    }

    if (error.type === "entity.parse.failed") {
        status = 400
        message = "Invalid JSON"
    }

    if (error.type === "entity.too.large") {
        status = 413
        message = "Request body is too large"
    }

    if (status === 500) {
        console.error(error)
    }

    const errorNames = {
        400: "BadRequest",
        401: "Unauthorized",
        403: "Forbidden",
        404: "NotFound",
        409: "Conflict",
        413: "PayloadTooLarge",
        500: "InternalServerError",
        503: "ServiceUnavailable"
    }

    return res.status(status).json({
        error: errorNames[status] || "Error",
        message
    })
}

export function cors(req: Request, res: Response, next: NextFunction) {

    const allowedOrigins = process.env.CORS_ORIGINS ||
        "http://localhost:3001,http://127.0.0.1:3001"

    const origins = allowedOrigins.split(",")
    const origin = req.headers.origin

    if (origin && origins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin)
        res.setHeader("Vary", "Origin")
        res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type")
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
    }

    if (req.method === "OPTIONS") {
        return res.status(204).send()
    }

    next()
}
