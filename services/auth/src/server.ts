import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { createApp } from "./app";
import { env } from "./config/env";

async function main() {
  await AppDataSource.initialize();
  console.log("Auth database connected");

  await AppDataSource.runMigrations();
  console.log("Auth migrations applied");

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Auth service listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
