import "reflect-metadata";
import { DataSource } from "typeorm";
import { Article, PlanWorkout, ProgressEntry, TrainingPlan, User, Workout } from "./entities.js";

export const appDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL ?? "postgres://fitflow:fitflow@localhost:5432/fitflow",
  entities: [User, Workout, TrainingPlan, PlanWorkout, ProgressEntry, Article],
  synchronize: process.env.DB_SYNCHRONIZE !== "false",
  logging: process.env.DB_LOGGING === "true",
});
