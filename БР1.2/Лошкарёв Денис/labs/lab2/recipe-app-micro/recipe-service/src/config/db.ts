import { DataSource } from "typeorm";
import { Recipe } from "../entities/Recipe";
import { RecipeStep } from "../entities/RecipeStep";
import { Ingredient } from "../entities/Ingredient";
import { RecipeIngredient } from "../entities/RecipeIngredient";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "db",
    port: 5432,
    username: process.env.DB_USER || "chef",
    password: process.env.DB_PASSWORD || "chefpass",
    database: "db_recipes",
    synchronize: true,
    entities: [Recipe, RecipeStep, Ingredient, RecipeIngredient], 
});