import { Elysia } from "elysia";
import { openapiPlugin } from "./openapi";
import { jobSeekerRoutes } from "./routes/public";
import { internalRoutes } from "./routes/internal";

const port = Number(process.env.PORT ?? 3003);

const app = new Elysia()
  .use(openapiPlugin)
  .use(internalRoutes)
  .group("/api/v1", (api) => api.use(jobSeekerRoutes))
  .listen(port);

console.log(`Jobseeker service: http://${app.server?.hostname}:${app.server?.port}`);
