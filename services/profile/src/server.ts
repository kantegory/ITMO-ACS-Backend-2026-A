import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { createApp } from "./app";
import { env } from "./config/env";
import { startConsumer } from "./messaging/consumer";

async function main() {
  await AppDataSource.initialize();
  console.log("Profile database connected");

  await AppDataSource.runMigrations();
  console.log("Profile migrations applied");

  await startConsumer();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Profile service listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
