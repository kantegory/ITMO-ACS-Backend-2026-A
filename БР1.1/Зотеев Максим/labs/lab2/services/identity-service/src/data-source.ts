import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "./config";
import { User } from "./entities/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: true,
  logging: false,
  entities: [User],
});
