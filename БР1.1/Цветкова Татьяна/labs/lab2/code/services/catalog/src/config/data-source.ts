import "reflect-metadata";
import { DataSource } from "typeorm";
import { Workout } from "../entities/Workout";
import { WorkoutCategory } from "../entities/WorkoutCategory";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DB_DATABASE ?? "catalog.db",
  entities: [Workout, WorkoutCategory],
  synchronize: true,
  logging: false,
});
