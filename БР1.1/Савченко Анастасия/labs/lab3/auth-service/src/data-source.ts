import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./models/user.entity"

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: "postgres", password: "postgres",
  database: "auth_db",
  synchronize: true,
  entities: [User]
})