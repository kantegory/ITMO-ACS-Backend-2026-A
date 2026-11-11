import "reflect-metadata";
import { DataSource } from "typeorm";
import { Deal } from "./entities/Deal";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DEALS_DB_HOST || "localhost",
  port: parseInt(process.env.DEALS_DB_PORT || "5435", 10),
  username: process.env.DEALS_DB_USER || "rent",
  password: process.env.DEALS_DB_PASS || "rent",
  database: process.env.DEALS_DB_NAME || "deals_db",
  synchronize: true,
  logging: false,
  entities: [Deal],
});
