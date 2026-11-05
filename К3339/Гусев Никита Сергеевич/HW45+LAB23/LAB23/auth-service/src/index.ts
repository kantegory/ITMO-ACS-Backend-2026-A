import express from "express"
import { AppDataSource } from "./data-source"
import authRoutes from "./routes/auth.routes"
import followRoutes from "./routes/follow.routes"
import { getMe, getInternalUser } from "./controllers/user.controller"
import { authMiddleware } from "../../shared/auth"
import { internalAuth } from "../../shared/internal"
import { cors, errorHandler } from "../../shared/http"

const app = express()

app.use(cors)
app.use(express.json({ limit: "100kb" }))

app.use("/auth", authRoutes)
app.use("/", followRoutes)

app.get("/users/me", authMiddleware, getMe)
app.get("/internal/users/:id", internalAuth, getInternalUser)

app.get("/", (req, res) => {
    res.send("Auth Service works")
})

app.get("/health", async (req, res) => {
    try {
        await AppDataSource.query("SELECT 1")
        return res.json({ status: "ok" })
    } catch {
        return res.status(503).json({
            error: "ServiceUnavailable",
            message: "Database unavailable"
        })
    }
})

app.use((req, res) => {
    return res.status(404).json({
        error: "NotFound",
        message: "Route not found"
    })
})

app.use(errorHandler)

AppDataSource.initialize()
    .then(() => {
        console.log("Auth DB connected")

        app.listen(8081, () => {
            console.log("Auth Service started on port 8081")
        })

    })
    .catch(error => {
        console.error("Auth service startup failed:", error.message)
        process.exit(1)
    })
