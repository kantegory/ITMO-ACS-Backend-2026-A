import { Elysia } from "elysia";
import { openapiPlugin } from "./openapi";
import { catalogRoutes } from "./routes/public";
import { internalRoutes } from "./routes/internal";

const port = Number(process.env.PORT ?? 3002);

const app = new Elysia()
  .use(openapiPlugin)
  .use(internalRoutes)
  .group("/api/v1", (api) => api.use(catalogRoutes))
  .listen(port);

console.log(`Catalog service: http://${app.server?.hostname}:${app.server?.port}`);
