const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
app.use(express.json());

// загрузка OpenAPI
const swaggerDocument = YAML.load('./swagger.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// тестовый маршрут
app.get('/', (req, res) => {
  res.send('API работает');
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});