import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./config/env";
import { Company } from "./entities/Company";
import { Vacancy } from "./entities/Vacancy";
import { InitVacancy1732000002000 } from "./migrations/1732000002000-InitVacancy";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.databaseUrl,
  entities: [Company, Vacancy],
  migrations: [InitVacancy1732000002000],
  synchronize: false,
  logging: env.nodeEnv === "development",
});
