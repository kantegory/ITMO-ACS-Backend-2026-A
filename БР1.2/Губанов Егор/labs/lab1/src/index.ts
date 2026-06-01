import "reflect-metadata";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { buildRoutes } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { seedPropertyTypes } from "./seed";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1", buildRoutes());
app.use(errorHandler);

const port = parseInt(process.env.PORT || "3000", 10);

AppDataSource.initialize()
  .then(async () => {
    await seedPropertyTypes();
    app.listen(port, () => {
      console.log("http://localhost:" + port + "/api/v1");
    });
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
