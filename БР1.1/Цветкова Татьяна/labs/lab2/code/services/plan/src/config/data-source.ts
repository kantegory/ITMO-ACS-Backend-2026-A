import "reflect-metadata";
import { DataSource } from "typeorm";
import { WorkoutPlan } from "../entities/WorkoutPlan";
import { PlanItem } from "../entities/PlanItem";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DB_DATABASE ?? "plan.db",
  entities: [WorkoutPlan, PlanItem],
  synchronize: true,
  logging: false,
});
