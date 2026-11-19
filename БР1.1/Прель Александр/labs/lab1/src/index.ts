import { config } from "./config";
import { AppDataSource } from "./data-source";
import { createApp } from "./app";
import { seedDatabase } from "./seed/seed-data";

const bootstrap = async () => {
  await AppDataSource.initialize();
  await seedDatabase(AppDataSource);

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Restaurant booking API is running on http://localhost:${config.port}`);
  });
};

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
