import "reflect-metadata";
import { DataSource } from "typeorm";
import { SkillEntity } from "./entities.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5434),
  username: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  database: process.env.DB_NAME ?? "skills_db",
  synchronize: true,
  logging: false,
  entities: [SkillEntity],
});
