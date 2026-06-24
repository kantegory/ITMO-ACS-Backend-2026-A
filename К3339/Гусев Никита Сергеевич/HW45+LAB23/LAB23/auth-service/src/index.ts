import express from "express"
import { AppDataSource } from "./data-source"
import authRoutes from "./routes/auth.routes"
import followRoutes from "./routes/follow.routes";

const app = express()

app.use(express.json())

app.use("/auth", authRoutes)
app.use("/", followRoutes)

app.get("/", (req, res) => {
    res.send("Auth Service works")
})

AppDataSource.initialize()
    .then(() => {

        console.log("Auth DB connected")

        app.listen(8081, () => {
            console.log("Auth Service started on port 8081")
        })

    })
    .catch((error) => console.log(error))