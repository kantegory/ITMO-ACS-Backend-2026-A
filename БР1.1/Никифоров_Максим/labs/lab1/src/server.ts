import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { createApp } from "./app";
import { env } from "./config/env";

async function main() {
  await AppDataSource.initialize();
  console.log("Database connected");

  await AppDataSource.runMigrations();
  console.log("Migrations applied");

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
    console.log(`Swagger UI: http://localhost:${env.port}/api-docs`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
