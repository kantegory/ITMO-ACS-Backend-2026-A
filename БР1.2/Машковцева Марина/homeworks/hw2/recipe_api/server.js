const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const port = 3000;

// Загружаем OpenAPI спецификацию
const swaggerDocument = YAML.load('./tsp-output/@typespec/openapi3/openapi.yaml');

// Запускаем Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Запускаем сервер
app.listen(port, () => {
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
});