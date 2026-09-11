import "reflect-metadata";
import { DataSource } from "typeorm";
import { ProgressEntry } from "./entities.js";

export const dataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL ?? "postgres://fitflow:fitflow@localhost:5432/fitflow_progress",
  entities: [ProgressEntry],
  synchronize: process.env.DB_SYNCHRONIZE !== "false",
  logging: process.env.DB_LOGGING === "true",
});
