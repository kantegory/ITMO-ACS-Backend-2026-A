import { Elysia } from "elysia";
import { startEmployerApplicationEventsConsumer } from "@lab2/messaging";
import { openapiPlugin } from "./openapi";
import { companiesRoutes } from "./routes/companies";
import { vacanciesRoutes } from "./routes/vacancies";
import { internalRoutes } from "./routes/internal";

const port = Number(process.env.PORT ?? 3004);

startEmployerApplicationEventsConsumer(async (payload) => {
  console.log(
    `новый отклик applicationId=${payload.applicationId} vacancyId=${payload.vacancyId} userId=${payload.applicantUserId}`
  );
});

const app = new Elysia()
  .use(openapiPlugin)
  .use(internalRoutes)
  .group("/api/v1", (api) => api.use(companiesRoutes).use(vacanciesRoutes))
  .listen(port);

console.log(`Employer service: http://${app.server?.hostname}:${app.server?.port}`);
