import dotenv from 'dotenv';

dotenv.config();

export const settings = {
  port: parseInt(process.env.PORT || '3000', 10),
  isDev: process.env.NODE_ENV === 'development',

  services: {
    user: process.env.USER_SERVICE_URL || 'http://localhost:8001',
    company: process.env.COMPANY_SERVICE_URL || 'http://localhost:8002',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:8003',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8004',
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум запросов с одного IP
  },
};