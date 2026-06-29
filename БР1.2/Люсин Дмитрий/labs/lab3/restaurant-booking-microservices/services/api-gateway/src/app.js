const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const axios = require('axios');
const path = require('path');
const createProxy = require('./utils/proxy');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:3002',
  menu: process.env.MENU_SERVICE_URL || 'http://localhost:3003',
  media: process.env.MEDIA_SERVICE_URL || 'http://localhost:3004',
  booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:3005',
  review: process.env.REVIEW_SERVICE_URL || 'http://localhost:3006',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007'
};

const openapiPath = path.join(__dirname, '..', '..', '..', 'docs', 'gateway-openapi.yaml');
const swaggerDocument = YAML.load(openapiPath);

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', async (req, res) => {
  const result = {};

  for (const [name, url] of Object.entries(services)) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 1500 });
      result[name] = response.data.status;
    } catch (error) {
      result[name] = 'unavailable';
    }
  }

  res.json({ service: 'api-gateway', status: 'ok', dependencies: result });
});

app.use('/api/restaurants/:restaurantId/menu', createProxy(services.menu));
app.use('/api/restaurants/:restaurantId/menu-categories', createProxy(services.menu));
app.use('/api/menu-categories', createProxy(services.menu));
app.use('/api/menu-items', createProxy(services.menu));
app.use('/api/restaurants/:restaurantId/photos', createProxy(services.media));
app.use('/api/restaurant-photos', createProxy(services.media));
app.use('/api/restaurants/:restaurantId/reviews', createProxy(services.review));
app.use('/api/reviews', createProxy(services.review));
app.use('/api/notifications', createProxy(services.notification));
app.use('/api/auth', createProxy(services.auth));
app.use('/api/users', createProxy(services.auth));
app.use('/api/bookings', createProxy(services.booking));
app.use('/api/admin/bookings', createProxy(services.booking));
app.use('/api/cuisines', createProxy(services.catalog));
app.use('/api/restaurants', createProxy(services.catalog));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
