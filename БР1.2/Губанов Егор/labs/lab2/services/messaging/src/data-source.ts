import "reflect-metadata";
import { DataSource } from "typeorm";
import { Message } from "./entities/Message";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.MESSAGING_DB_HOST || "localhost",
  port: parseInt(process.env.MESSAGING_DB_PORT || "5436", 10),
  username: process.env.MESSAGING_DB_USER || "rent",
  password: process.env.MESSAGING_DB_PASS || "rent",
  database: process.env.MESSAGING_DB_NAME || "messaging_db",
  synchronize: true,
  logging: false,
  entities: [Message],
});
