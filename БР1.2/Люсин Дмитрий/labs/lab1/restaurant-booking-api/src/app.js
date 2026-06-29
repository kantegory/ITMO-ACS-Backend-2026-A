const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'Restaurant Booking API', docs: '/api-docs' });
});

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Маршрут не найден', details: null } });
});

app.use(errorMiddleware);

module.exports = app;
