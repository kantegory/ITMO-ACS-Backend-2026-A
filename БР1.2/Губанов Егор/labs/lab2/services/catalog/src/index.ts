import "reflect-metadata";
import dotenv from "dotenv";
import path from "path";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { buildRoutes } from "./routes";
import { seedPropertyTypes } from "./seed";
import { errorHandler } from "../../../packages/shared/src/errorHandler";

dotenv.config({ path: path.join(__dirname, "../../../.env") });

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1", buildRoutes());
app.use(errorHandler);

const port = parseInt(process.env.CATALOG_PORT || "3002", 10);

AppDataSource.initialize()
  .then(async () => {
    await seedPropertyTypes();
    app.listen(port, () => {
      console.log("catalog http://localhost:" + port + "/api/v1");
    });
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
