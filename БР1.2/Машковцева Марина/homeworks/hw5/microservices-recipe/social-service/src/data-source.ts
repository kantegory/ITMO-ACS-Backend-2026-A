import "reflect-metadata";
import { DataSource } from "typeorm";
import { Like } from "./models/Like";
import { Comment } from "./models/Comment";
import { SavedRecipe } from "./models/SavedRecipe";
import { Subscription } from "./models/Subscription";
import { User } from "./models/User";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "social_db.sqlite",
    synchronize: true,
    logging: true,
    entities: [Like, Comment, SavedRecipe, Subscription, User],
});
