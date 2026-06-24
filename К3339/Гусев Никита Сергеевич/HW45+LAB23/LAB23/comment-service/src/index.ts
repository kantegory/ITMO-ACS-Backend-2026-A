import express from "express"
import { AppDataSource } from "./data-source"
import commentRoutes from "./routes/comment.routes"

const app = express()

app.use(express.json())

app.use("/comments", commentRoutes)

app.get("/", (req, res) => {
    res.send("Comment Service works")
})

AppDataSource.initialize()
    .then(() => {

        console.log("Comment DB connected")

        app.listen(8083, () => {
            console.log("Comment Service started on port 8083")
        })

    })
    .catch((error) => console.log(error))