import { Elysia } from "elysia";
import { openapiPlugin } from "./openapi";
import { applicationsRoutes } from "./routes/applications";

const port = Number(process.env.PORT ?? 3005);

const app = new Elysia()
  .use(openapiPlugin)
  .group("/api/v1", (api) => api.use(applicationsRoutes))
  .listen(port);

console.log(`Application service: http://${app.server?.hostname}:${app.server?.port}`);
