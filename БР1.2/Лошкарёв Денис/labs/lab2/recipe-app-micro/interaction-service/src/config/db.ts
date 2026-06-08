import { DataSource } from "typeorm";
import { Like } from "../entities/Like";
import { Comment } from "../entities/Comment";
import { Favorite } from "../entities/Favorite";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "db",
    port: 5432,
    username: process.env.DB_USER || "chef",
    password: process.env.DB_PASSWORD || "chefpass",
    database: "db_interactions", 
    synchronize: true,
    entities: [Like, Comment, Favorite],
});