import "reflect-metadata"
import { DataSource } from "typeorm"
import { databaseOptions } from "../../shared/config"
import { User } from "./entities/User"
import { Follow } from "./entities/Follow"

export const AppDataSource = new DataSource({
    ...databaseOptions("auth-db", "auth_db"), entities: [User, Follow]
})
