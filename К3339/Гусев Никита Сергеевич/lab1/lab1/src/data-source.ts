import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entities/User"
import { Recipe } from "./entities/Recipe"
import { Comment } from "./entities/Comment"
import { Like } from "./entities/Like"
import { SavedRecipe } from "./entities/SavedRecipe"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "123",
    database: "recipes_db",
    synchronize: true,
    logging: false,
    entities: [User, Recipe, Comment, Like, SavedRecipe],
})