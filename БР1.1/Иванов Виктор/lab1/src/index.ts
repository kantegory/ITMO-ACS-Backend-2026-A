import "reflect-metadata";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 8000;

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`API base: http://localhost:${PORT}/api/v1`);
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
    process.exit(1);
  });
