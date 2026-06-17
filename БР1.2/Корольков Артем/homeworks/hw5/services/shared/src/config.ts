export const JWT_SECRET = process.env.JWT_SECRET || 'restaurant-api-dev-secret';
export const SERVICE_KEY = process.env.SERVICE_KEY || 'inter-service-dev-key';

export const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
export const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';
export const RESERVATION_SERVICE_URL = process.env.RESERVATION_SERVICE_URL || 'http://localhost:3003';

export const RABBITMQ_ENABLED = process.env.RABBITMQ_ENABLED !== 'false';
