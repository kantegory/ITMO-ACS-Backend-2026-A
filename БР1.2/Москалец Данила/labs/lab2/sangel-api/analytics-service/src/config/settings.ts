import dotenv from 'dotenv';

dotenv.config();

export const settings = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8004', 10),
  isDev: process.env.NODE_ENV === 'development',

  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:8001',
  companyServiceUrl: process.env.COMPANY_SERVICE_URL || 'http://localhost:8002',
  orderServiceUrl: process.env.ORDER_SERVICE_URL || 'http://localhost:8003',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'analytics-service-secret-key',
  },
};