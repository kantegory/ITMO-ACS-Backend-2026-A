import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DB_DATABASE ?? "auth.db",
  entities: [User],
  synchronize: true,
  logging: false,
});
