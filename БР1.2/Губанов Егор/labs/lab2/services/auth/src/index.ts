import "reflect-metadata";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { buildRoutes } from "./routes";
import { errorHandler } from "../../../packages/shared/src/errorHandler";

dotenv.config({ path: require("path").join(__dirname, "../../../.env") });

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1", buildRoutes());
app.use(errorHandler);

const port = parseInt(process.env.AUTH_PORT || "3001", 10);

AppDataSource.initialize()
  .then(() => {
    app.listen(port, () => {
      console.log("auth http://localhost:" + port + "/api/v1");
    });
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
