const axios = require('axios');
const ApiError = require('./apiError');

const headers = () => ({ 'x-service-token': process.env.SERVICE_TOKEN || 'internal_service_token_123' });

const catalogClient = axios.create({
  baseURL: process.env.CATALOG_SERVICE_URL || 'http://localhost:3002',
  timeout: 5000
});

const bookingClient = axios.create({
  baseURL: process.env.BOOKING_SERVICE_URL || 'http://localhost:3005',
  timeout: 5000
});

const ensureRestaurantExists = async (restaurantId) => {
  try {
    await catalogClient.get(`/api/internal/restaurants/${restaurantId}/exists`, { headers: headers() });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new ApiError(404, 'Ресторан не найден');
    }
    throw new ApiError(502, 'Ошибка взаимодействия с Catalog Service');
  }
};

const checkReviewPermission = async ({ bookingId, userId, restaurantId }) => {
  try {
    await bookingClient.get(`/api/internal/bookings/${bookingId}/review-permission`, {
      headers: headers(),
      params: { user_id: userId, restaurant_id: restaurantId }
    });
  } catch (error) {
    if (error.response && [403, 404].includes(error.response.status)) {
      throw new ApiError(error.response.status, error.response.data.message || 'Нельзя оставить отзыв');
    }
    throw new ApiError(502, 'Ошибка взаимодействия с Booking Service');
  }
};

module.exports = { ensureRestaurantExists, checkReviewPermission };
