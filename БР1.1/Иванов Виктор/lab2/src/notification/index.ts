import "reflect-metadata";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { NotificationDataSource } from "./dataSource";
import { startNotificationWorker } from "./worker";

dotenv.config();

async function main() {
  const dbPath =
    process.env.NOTIFICATION_DATABASE_PATH || path.join(process.cwd(), "data", "notification.sqlite");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  await NotificationDataSource.initialize();
  await startNotificationWorker();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
