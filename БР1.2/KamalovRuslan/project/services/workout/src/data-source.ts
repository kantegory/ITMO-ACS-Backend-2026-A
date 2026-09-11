import "reflect-metadata";
import { DataSource } from "typeorm";
import { PlanWorkout, TrainingPlan, Workout } from "./entities.js";

export const dataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL ?? "postgres://fitflow:fitflow@localhost:5432/fitflow_workout",
  entities: [Workout, TrainingPlan, PlanWorkout],
  synchronize: process.env.DB_SYNCHRONIZE !== "false",
  logging: process.env.DB_LOGGING === "true",
});
