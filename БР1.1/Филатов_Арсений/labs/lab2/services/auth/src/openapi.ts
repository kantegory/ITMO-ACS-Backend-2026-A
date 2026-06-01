import { openapi } from "@elysiajs/openapi";

export const openapiPlugin = openapi({
  path: "/openapi",
  specPath: "/openapi/json",
  documentation: {
    openapi: "3.0.3",
    info: {
      title: "Lab2 Auth Service",
      version: "1.0.0",
      description: "Аутентификация и учётные записи",
    },
    tags: [
      { name: "auth", description: "Регистрация, вход, обновление токена" },
      { name: "users", description: "Текущий пользователь" },
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
