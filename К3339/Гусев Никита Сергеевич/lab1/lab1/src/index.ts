import express from "express"
import {AppDataSource} from "./data-source"
import authRoutes from "./routes/auth.routes"
import recipeRoutes from "./routes/recipe.routes"
import commentRoutes from "./routes/comment.routes"
import swaggerUi from "swagger-ui-express"
import YAML from "yamljs"
import {getMe} from "./controllers/user.controller"
import {authMiddleware} from "./middlewares/auth.middleware"
import likeRoutes from "./routes/like.routes"
import savedRoutes from "./routes/saved.routes"
import followRoutes from "./routes/follow.routes"

const swaggerDocument = YAML.load("openapi.yaml")

const app = express()

app.use(express.json())

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use("/", commentRoutes)
app.use("/auth", authRoutes)
app.use("/recipes", recipeRoutes)
app.use("/", likeRoutes)
app.use("/", savedRoutes)
app.use("/", followRoutes)

app.get("/", (req, res) => {
    res.send("API works")
})

app.get(
    "/users/me",
    authMiddleware,
    getMe
)

AppDataSource.initialize()
    .then(() => {

        console.log("Database connected")

        app.listen(8000, () => {
            console.log("Server started")
        })

    })
    .catch((error) => console.log(error))