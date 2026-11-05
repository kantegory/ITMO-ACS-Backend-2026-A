import { RequestHandler } from "express"
import { timingSafeEqual } from "crypto"
import { INTERNAL_TOKEN } from "./config"
import { HttpError } from "./http"

export const internalAuth: RequestHandler = (req, res, next) => {

    const token = req.header("X-Internal-Token") || ""
    const actual = Buffer.from(token)
    const expected = Buffer.from(INTERNAL_TOKEN)

    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Invalid internal token"
        })
    }

    next()
}

export async function internalRequest(
    service: "auth" | "recipe" | "comment",
    path: string,
    method = "GET"
) {

    const urls = {
        auth: process.env.AUTH_SERVICE_URL || "http://auth-service:8081",
        recipe: process.env.RECIPE_SERVICE_URL || "http://recipe-service:8082",
        comment: process.env.COMMENT_SERVICE_URL || "http://comment-service:8083"
    }

    let response: Response

    try {
        response = await fetch(urls[service] + path, {
            method,
            headers: {
                "X-Internal-Token": INTERNAL_TOKEN
            },
            signal: AbortSignal.timeout(3000)
        })
    } catch {
        throw new HttpError(503, service + " service unavailable")
    }

    if (response.status === 404) {
        throw new HttpError(404, "Related record not found")
    }

    if (!response.ok) {
        throw new HttpError(503, service + " service unavailable")
    }

    if (response.status === 204) {
        return
    }

    return response.json()
}
