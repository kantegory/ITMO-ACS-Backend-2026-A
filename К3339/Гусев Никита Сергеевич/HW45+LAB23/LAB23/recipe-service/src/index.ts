import express from "express"
import { AppDataSource } from "./data-source"
import recipeRoutes from "./routes/recipe.routes"
import likeRoutes from "./routes/like.routes"
import savedRoutes from "./routes/saved.routes"
import { RecipeController } from "./controllers/recipe.controller"
import { startUserConsumer } from "./consumers/user.consumer"
import { internalAuth } from "../../shared/internal"
import { cors, errorHandler } from "../../shared/http"

const app = express()

app.use(cors)
app.use(express.json({ limit: "100kb" }))

app.use("/recipes", recipeRoutes)
app.use("/recipes", likeRoutes)
app.use("/recipes", savedRoutes)

app.get("/internal/recipes/:id", internalAuth, RecipeController.getOne)

app.get("/", (req, res) => {
    res.send("Recipe Service works")
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
        console.log("Recipe DB connected")

        app.listen(8082, () => {
            console.log("Recipe Service started on port 8082")
        })

        startUserConsumer()

    })
    .catch(error => {
        console.error("Recipe service startup failed:", error.message)
        process.exit(1)
    })
