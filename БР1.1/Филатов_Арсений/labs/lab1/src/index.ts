import { Elysia } from "elysia";
import { openapiPlugin } from "./openapi";
import { applicationsRoutes } from "./routes/applications";
import { authRoutes } from "./routes/auth";
import { catalogRoutes } from "./routes/catalog";
import { companiesRoutes } from "./routes/companies";
import { jobSeekerRoutes } from "./routes/jobSeeker";
import { usersRoutes } from "./routes/users";
import { vacanciesRoutes } from "./routes/vacancies";

const app = new Elysia()
  .use(openapiPlugin)
  .group("/api/v1", (api) =>
    api
      .use(authRoutes)
      .use(usersRoutes)
      .use(catalogRoutes)
      .use(jobSeekerRoutes)
      .use(companiesRoutes)
      .use(vacanciesRoutes)
      .use(applicationsRoutes)
  )
  .listen(Number(process.env.PORT ?? 3000));

console.log(
  `Elysia: http://${app.server?.hostname}:${app.server?.port} - OpenAPI: http://${app.server?.hostname}:${app.server?.port}/openapi`
);
