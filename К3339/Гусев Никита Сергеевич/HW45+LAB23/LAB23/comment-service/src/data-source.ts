import "reflect-metadata"
import { DataSource } from "typeorm"
import { Comment } from "./entities/Comment"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "comment-db",
    port: 5432,
    username: "postgres",
    password: "123",
    database: "comment_db",
    synchronize: true,
    logging: false,
    entities: [Comment],
})