import { openapi } from "@elysiajs/openapi";

export const openapiPlugin = openapi({
  path: "/openapi",
  specPath: "/openapi/json",
  documentation: {
    openapi: "3.0.3",
    info: {
      title: "Job Search API",
      version: "1.0.0",
      description:
        "REST API сервиса поиска работы",
    },
    tags: [
      { name: "auth", description: "Регистрация, вход, обновление токена" },
      { name: "users", description: "Текущий пользователь" },
      { name: "catalog", description: "Справочники: отрасли, опыт, навыки" },
      { name: "job-seeker", description: "Профиль соискателя и резюме" },
      { name: "companies", description: "Компании работодателей" },
      { name: "vacancies", description: "Вакансии и публикация" },
      { name: "applications", description: "Отклики на вакансии" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Access token из ответа POST /api/v1/auth/login",
        },
      },
    },
  },
});
