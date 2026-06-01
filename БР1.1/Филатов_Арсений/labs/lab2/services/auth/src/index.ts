import { Elysia } from "elysia";
import { openapiPlugin } from "./openapi";
import { authRoutes } from "./routes/auth";
import { usersRoutes } from "./routes/users";

const port = Number(process.env.PORT ?? 3001);

const app = new Elysia()
  .use(openapiPlugin)
  .group("/api/v1", (api) => api.use(authRoutes).use(usersRoutes))
  .listen(port);

console.log(`Auth service: http://${app.server?.hostname}:${app.server?.port}`);
