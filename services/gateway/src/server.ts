import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();
app.listen(env.port, () => {
  console.log(`Gateway listening on http://localhost:${env.port}`);
  console.log(`Swagger UI: http://localhost:${env.port}/api-docs`);
});
