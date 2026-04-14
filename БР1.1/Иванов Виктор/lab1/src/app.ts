import "reflect-metadata";
import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import * as swaggerUi from "swagger-ui-express";
import * as yaml from "js-yaml";
import * as fs from "fs";
import * as path from "path";
import apiRoutes from "./routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Swagger UI
const swaggerDocument = yaml.load(
  fs.readFileSync(path.join(__dirname, "../openapi.yaml"), "utf8")
) as object;
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/v1", apiRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
