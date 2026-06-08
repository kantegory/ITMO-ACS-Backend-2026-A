import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
dotenv.config();

import { Recipe } from "../models/recipe.entity";
import { RecipeStep } from "../models/recipe-step.entity";
import { Ingredient } from "../models/ingredient.entity";
import { DishType } from "../models/dish-type.entity";
import { RecipeIngredient } from "../models/recipe-ingredient.entity";
import { RecipeDishType } from "../models/recipe-dish-type.entity";
import { SavedRecipe } from "../models/saved-recipe.entity";

const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5433", 10),
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "recipes_db",
    synchronize: true,
    logging: false,
    entities: [
        Recipe,
        RecipeStep,
        Ingredient,
        DishType,
        RecipeIngredient,
        RecipeDishType,
        SavedRecipe,
    ],
});

export default dataSource;
