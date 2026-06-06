import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./config/env";
import { CandidateProfile } from "./entities/CandidateProfile";
import { Resume } from "./entities/Resume";
import { ResumeSummary } from "./entities/ResumeSummary";
import { ResumeSkill } from "./entities/ResumeSkill";
import { Skill } from "./entities/Skill";
import { InitProfile1732000001000 } from "./migrations/1732000001000-InitProfile";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.databaseUrl,
  entities: [CandidateProfile, Resume, ResumeSummary, ResumeSkill, Skill],
  migrations: [InitProfile1732000001000],
  synchronize: false,
  logging: env.nodeEnv === "development",
});
