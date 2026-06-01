import { openapi } from "@elysiajs/openapi";

export const openapiPlugin = openapi({
  path: "/openapi",
  specPath: "/openapi/json",
  documentation: {
    openapi: "3.0.3",
    info: { title: "Lab2 Application Service", version: "1.0.0" },
    tags: [{ name: "applications", description: "Отклики" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
});
