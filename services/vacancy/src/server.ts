import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { createApp } from "./app";
import { env } from "./config/env";

async function main() {
  await AppDataSource.initialize();
  console.log("Vacancy database connected");

  await AppDataSource.runMigrations();
  console.log("Vacancy migrations applied");

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Vacancy service listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
