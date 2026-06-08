import "reflect-metadata";
import app from "./app";
import { AppDataSource } from "./config/data-source";
import { env } from "./config/env";

const start = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");
    app.listen(env.PORT, () => {
      console.log(`Server is running on http://localhost:${env.PORT}`);
      console.log(`Swagger UI: http://localhost:${env.PORT}/api/docs`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
};

start();
