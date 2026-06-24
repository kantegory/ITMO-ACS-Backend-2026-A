import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entities/User"
import {Follow} from "./entities/Follow";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "auth-db",
    port: 5432,
    username: "postgres",
    password: "123",
    database: "auth_db",
    synchronize: true,
    logging: false,
    entities: [User, Follow],
})