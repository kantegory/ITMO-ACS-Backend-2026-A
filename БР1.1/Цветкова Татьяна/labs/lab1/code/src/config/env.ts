import * as dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3000),

  DB_TYPE: (process.env.DB_TYPE ?? "sqlite") as "sqlite" | "postgres",
  DB_DATABASE: process.env.DB_DATABASE ?? "fitness.db",
  DB_HOST: process.env.DB_HOST ?? "localhost",
  DB_PORT: Number(process.env.DB_PORT ?? 5432),
  DB_USERNAME: process.env.DB_USERNAME ?? "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD ?? "postgres",

  JWT_SECRET: process.env.JWT_SECRET ?? "super_secret_change_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ?? "super_refresh_secret_change_me",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
};
