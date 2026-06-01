import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import * as path from "path";
import { NotificationLog } from "./entity/NotificationLog";

dotenv.config();

const dbPath = process.env.NOTIFICATION_DATABASE_PATH || path.join(process.cwd(), "data", "notification.sqlite");

export const NotificationDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: true,
  logging: false,
  entities: [NotificationLog],
});
