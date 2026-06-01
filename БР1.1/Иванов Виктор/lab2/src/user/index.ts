import "reflect-metadata";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { UserDataSource } from "./dataSource";
import { createUserApp } from "./app";

dotenv.config();

const port = Number(process.env.USER_PORT || 4001);

async function main() {
  const dbDir = path.dirname(process.env.USER_DATABASE_PATH || path.join(process.cwd(), "data", "user.sqlite"));
  fs.mkdirSync(dbDir, { recursive: true });

  await UserDataSource.initialize();
  const app = createUserApp();
  app.listen(port, () => {
    console.log(`user-service слушает порт ${port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
