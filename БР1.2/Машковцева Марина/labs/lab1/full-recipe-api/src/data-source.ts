import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./models/User";
import { Recipe } from "./models/Recipe";
import { Comment } from "./models/Comment";
import { Like } from "./models/Like";
import { SavedRecipe } from "./models/SavedRecipe";
import { Subscription } from "./models/Subscription";
import { Step } from "./models/Step";  

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite",
    synchronize: true,
    logging: true,
    entities: [User, Recipe, Comment, Like, SavedRecipe, Subscription, Step], 
});