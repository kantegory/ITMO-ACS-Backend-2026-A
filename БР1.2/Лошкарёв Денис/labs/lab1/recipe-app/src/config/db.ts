import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Recipe } from "../entities/Recipe";
import { Ingredient } from "../entities/Ingredient";
import { RecipeIngredient } from "../entities/RecipeIngredient";
import { RecipeStep } from "../entities/RecipeStep";
import { Comment } from "../entities/Comment";
import { Like } from "../entities/Like";
import { Favorite } from "../entities/Favorite";


import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: true,
     entities: [
        User, 
        Recipe, 
        Ingredient, 
        RecipeIngredient, 
        RecipeStep, 
        Comment, 
        Like, 
        Favorite
    ],
});