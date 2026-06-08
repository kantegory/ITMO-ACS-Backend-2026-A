import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { env } from "./env";
import { User } from "../entities/User";
import { Workout } from "../entities/Workout";
import { WorkoutCategory } from "../entities/WorkoutCategory";
import { WorkoutPlan } from "../entities/WorkoutPlan";
import { PlanItem } from "../entities/PlanItem";
import { ProgressEntry } from "../entities/ProgressEntry";
import { BlogPost } from "../entities/BlogPost";
import { BlogCategory } from "../entities/BlogCategory";
import { BlogComment } from "../entities/BlogComment";

const entities = [
  User,
  Workout,
  WorkoutCategory,
  WorkoutPlan,
  PlanItem,
  ProgressEntry,
  BlogPost,
  BlogCategory,
  BlogComment,
];

const baseOptions: Partial<DataSourceOptions> = {
  entities,
  synchronize: env.NODE_ENV !== "production",
  logging: env.NODE_ENV === "development",
};

const options: DataSourceOptions =
  env.DB_TYPE === "postgres"
    ? {
        type: "postgres",
        host: env.DB_HOST,
        port: env.DB_PORT,
        username: env.DB_USERNAME,
        password: env.DB_PASSWORD,
        database: env.DB_DATABASE,
        ...baseOptions,
      } as DataSourceOptions
    : {
        type: "sqlite",
        database: env.DB_DATABASE,
        ...baseOptions,
      } as DataSourceOptions;

export const AppDataSource = new DataSource(options);
