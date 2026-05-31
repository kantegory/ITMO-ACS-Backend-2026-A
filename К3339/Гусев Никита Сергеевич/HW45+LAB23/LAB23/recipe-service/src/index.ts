import express from "express"
import { AppDataSource } from "./data-source"
import recipeRoutes from "./routes/recipe.routes"
import likeRoutes from "./routes/like.routes"
import savedRoutes from "./routes/saved.routes"
import { startUserConsumer } from "./consumers/user.consumer"

const app = express()

app.use(express.json())

app.use("/recipes", recipeRoutes)
app.use("/recipes", likeRoutes)
app.use("/recipes", savedRoutes)

app.get("/", (req, res) => {
    res.send("Recipe Service works")
})

AppDataSource.initialize()
    .then(async () => {

        console.log("Recipe DB connected")

        await startUserConsumer()

        app.listen(8082, () => {
            console.log("Recipe Service started on port 8082")
        })

    })
    .catch((error) => console.log(error))