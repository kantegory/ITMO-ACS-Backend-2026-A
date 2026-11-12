import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

const dbPath = process.env.USER_DATABASE_PATH || path.join(process.cwd(), "data", "user.sqlite");

export const UserDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: true,
  logging: false,
  entities: [User],
});
