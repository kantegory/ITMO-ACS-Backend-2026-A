import { AppDataSource } from "../data-source";
import { seedDatabase } from "./seed-data";

AppDataSource.initialize()
  .then(async () => {
    await seedDatabase(AppDataSource);
    await AppDataSource.destroy();
    console.log("Seed data is ready.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
