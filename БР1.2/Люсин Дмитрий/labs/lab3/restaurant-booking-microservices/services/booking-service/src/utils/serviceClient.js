const axios = require('axios');
const ApiError = require('./apiError');

const headers = () => ({ 'x-service-token': process.env.SERVICE_TOKEN || 'internal_service_token_123' });

const authClient = axios.create({
  baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  timeout: 5000
});

const catalogClient = axios.create({
  baseURL: process.env.CATALOG_SERVICE_URL || 'http://localhost:3002',
  timeout: 5000
});

const ensureUserExists = async (userId) => {
  try {
    await authClient.get(`/api/internal/users/${userId}/exists`, { headers: headers() });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new ApiError(404, 'Пользователь не найден');
    }
    throw new ApiError(502, 'Ошибка взаимодействия с Auth & User Service');
  }
};

const getTable = async (restaurantId, tableId) => {
  try {
    const response = await catalogClient.get(`/api/internal/restaurants/${restaurantId}/tables/${tableId}`, { headers: headers() });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new ApiError(404, 'Ресторан или столик не найден');
    }
    throw new ApiError(502, 'Ошибка взаимодействия с Catalog Service');
  }
};

module.exports = { ensureUserExists, getTable };
