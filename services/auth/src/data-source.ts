import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./config/env";
import { User } from "./entities/User";
import { RefreshSession } from "./entities/RefreshSession";
import { InitAuth1732000000000 } from "./migrations/1732000000000-InitAuth";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.databaseUrl,
  entities: [User, RefreshSession],
  migrations: [InitAuth1732000000000],
  synchronize: false,
  logging: env.nodeEnv === "development",
});
