import "reflect-metadata"
import { DataSource } from "typeorm"
import { databaseOptions } from "../../shared/config"
import { Comment } from "./entities/Comment"

export const AppDataSource = new DataSource({
    ...databaseOptions("comment-db", "comment_db"), entities: [Comment]
})
