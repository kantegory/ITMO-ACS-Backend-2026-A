import { DataSource } from "typeorm";
import { User } from "../entities/User";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "db",
    port: 5432,
    username: process.env.DB_USER || "chef",
    password: process.env.DB_PASSWORD || "chefpass",
    database: process.env.DB_NAME || "db_auth",
    synchronize: true,
    logging: true,
    entities: [User],
});