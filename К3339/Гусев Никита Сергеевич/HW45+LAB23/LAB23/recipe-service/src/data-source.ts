import "reflect-metadata"
import { DataSource } from "typeorm"
import { Recipe } from "./entities/Recipe"
import { Like } from "./entities/Like"
import { SavedRecipe } from "./entities/SavedRecipe"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "recipe-db",
    port: 5432,
    username: "postgres",
    password: "123",
    database: "recipe_db",
    synchronize: true,
    logging: false,
    entities: [Recipe, Like, SavedRecipe],
})