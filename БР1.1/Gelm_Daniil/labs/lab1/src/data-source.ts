import "reflect-metadata";
import { DataSource } from "typeorm";
import {
  ApplicationEntity,
  CompanyEntity,
  FavoriteVacancyEntity,
  ResumeEntity,
  ResumeSkillEntity,
  SkillEntity,
  UserEntity,
  VacancyEntity,
  VacancySkillEntity,
} from "./entities";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  database: process.env.DB_NAME ?? "job_search",
  synchronize: true,
  logging: false,
  entities: [
    UserEntity,
    CompanyEntity,
    ResumeEntity,
    SkillEntity,
    ResumeSkillEntity,
    VacancyEntity,
    VacancySkillEntity,
    ApplicationEntity,
    FavoriteVacancyEntity,
  ],
});
