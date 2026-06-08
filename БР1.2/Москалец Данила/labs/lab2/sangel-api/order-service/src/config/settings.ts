import dotenv from 'dotenv';

dotenv.config();

export const settings = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8003', 10),
  isDev: process.env.NODE_ENV === 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5436', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'order_db',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'order-service-secret-key',
  },

  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:8001',
  companyServiceUrl: process.env.COMPANY_SERVICE_URL || 'http://localhost:8002',
};