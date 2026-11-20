import "reflect-metadata";
import { DataSource } from "typeorm";
import {
  User,
  UserProfile,
  UserProgress,
  Exercise,
  Workout,
  UserWorkout,
  BlogPost,
} from "./entity";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "fitness.db",
  synchronize: true,
  logging: false,
  entities: [
    User,
    UserProfile,
    UserProgress,
    Exercise,
    Workout,
    UserWorkout,
    BlogPost,
  ],
});
