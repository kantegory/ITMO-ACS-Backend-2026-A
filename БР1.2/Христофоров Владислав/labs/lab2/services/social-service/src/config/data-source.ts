import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
dotenv.config();

import { BlogPost } from "../models/blog-post.entity";
import { Comment } from "../models/comment.entity";
import { Like } from "../models/like.entity";
import { Subscription } from "../models/subscription.entity";

const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5434", 10),
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "social_db",
    synchronize: true,
    logging: false,
    entities: [BlogPost, Comment, Like, Subscription],
});

export default dataSource;
