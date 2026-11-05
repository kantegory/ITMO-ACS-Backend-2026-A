import express from "express"
import { AppDataSource } from "./data-source"
import commentRoutes from "./routes/comment.routes"
import { CommentController } from "./controllers/comment.controller"
import { internalAuth } from "../../shared/internal"
import { cors, errorHandler } from "../../shared/http"

const app = express()

app.use(cors)
app.use(express.json({ limit: "100kb" }))

app.use("/comments", commentRoutes)

app.get("/internal/comments/recipe/:id", internalAuth, CommentController.getInternal)
app.delete("/internal/comments/recipe/:id", internalAuth, CommentController.deleteByRecipe)

app.get("/", (req, res) => {
    res.send("Comment Service works")
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
        console.log("Comment DB connected")

        app.listen(8083, () => {
            console.log("Comment Service started on port 8083")
        })

    })
    .catch(error => {
        console.error("Comment service startup failed:", error.message)
        process.exit(1)
    })
