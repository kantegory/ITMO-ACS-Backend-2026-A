import "reflect-metadata"
import { DataSource } from "typeorm"
import { databaseOptions } from "../../shared/config"
import { Recipe } from "./entities/Recipe"
import { Like } from "./entities/Like"
import { SavedRecipe } from "./entities/SavedRecipe"

export const AppDataSource = new DataSource({
    ...databaseOptions("recipe-db", "recipe_db"), entities: [Recipe, Like, SavedRecipe]
})
