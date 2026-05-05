import { openapi } from "@elysiajs/openapi";

export const openapiPlugin = openapi({
  path: "/openapi",
  specPath: "/openapi/json",
  documentation: {
    openapi: "3.0.3",
    info: { title: "Lab2 Catalog Service", version: "1.0.0" },
    tags: [{ name: "catalog", description: "Справочники" }],
    components: {},
  },
});
