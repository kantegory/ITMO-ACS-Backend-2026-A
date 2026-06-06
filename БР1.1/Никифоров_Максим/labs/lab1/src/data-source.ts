import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./config/env";
import { User } from "./entities/User";
import { CandidateProfile } from "./entities/CandidateProfile";
import { Resume } from "./entities/Resume";
import { Company } from "./entities/Company";
import { Vacancy } from "./entities/Vacancy";
import { RefreshSession } from "./entities/RefreshSession";
import { Init1730000000000 } from "./migrations/1730000000000-Init";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.databaseUrl,
  entities: [User, CandidateProfile, Resume, Company, Vacancy, RefreshSession],
  migrations: [Init1730000000000],
  synchronize: false,
  logging: env.nodeEnv === "development",
});
