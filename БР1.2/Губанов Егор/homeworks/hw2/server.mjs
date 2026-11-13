import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "js-yaml";
import fs from "fs";

const app = express();
const swaggerDocument = YAML.load(fs.readFileSync("./tsp-output/schema/openapi.yaml", "utf8"));

app.get("/docs/openapi.yaml", (req, res) => {
  res.sendFile("tsp-output/schema/openapi.yaml", { root: process.cwd() });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = 8001;
app.listen(port, () => {
  console.log(`аренда: http://localhost:${port}/docs`);
});
