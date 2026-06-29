const axios = require('axios');
const ApiError = require('./apiError');

const catalogClient = axios.create({
  baseURL: process.env.CATALOG_SERVICE_URL || 'http://localhost:3002',
  timeout: 5000,
  headers: { 'x-service-token': process.env.SERVICE_TOKEN || 'internal_service_token_123' }
});

const ensureRestaurantExists = async (restaurantId) => {
  try {
    await catalogClient.get(`/api/internal/restaurants/${restaurantId}/exists`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new ApiError(404, 'Ресторан не найден');
    }
    throw new ApiError(502, 'Ошибка взаимодействия с Catalog Service');
  }
};

module.exports = { ensureRestaurantExists };
