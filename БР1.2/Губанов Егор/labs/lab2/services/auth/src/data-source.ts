import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { RefreshToken } from "./entities/RefreshToken";
import { PasswordResetToken } from "./entities/PasswordResetToken";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.AUTH_DB_HOST || "localhost",
  port: parseInt(process.env.AUTH_DB_PORT || "5433", 10),
  username: process.env.AUTH_DB_USER || "rent",
  password: process.env.AUTH_DB_PASS || "rent",
  database: process.env.AUTH_DB_NAME || "auth_db",
  synchronize: true,
  logging: false,
  entities: [User, RefreshToken, PasswordResetToken],
});
