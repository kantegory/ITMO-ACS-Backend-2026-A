import dotenv from 'dotenv';

dotenv.config();

export const env = {
  service: process.env.SERVICE || 'gateway',
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'jobsite',
    password: process.env.DB_PASSWORD || 'jobsite',
    // имя БД зависит от сервиса; задаётся через DB_NAME в compose
    name: process.env.DB_NAME || 'jobsite',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessExpiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN || '900', 10),
    refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '2592000', 10),
  },

  internalToken: process.env.INTERNAL_TOKEN || 'internal-secret',

  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',

  // адреса других сервисов (для межсервисных вызовов)
  services: {
    auth: process.env.AUTH_URL || 'http://localhost:3001',
    catalog: process.env.CATALOG_URL || 'http://localhost:3002',
    seeker: process.env.SEEKER_URL || 'http://localhost:3003',
    employer: process.env.EMPLOYER_URL || 'http://localhost:3004',
    vacancy: process.env.VACANCY_URL || 'http://localhost:3005',
    application: process.env.APPLICATION_URL || 'http://localhost:3006',
    notification: process.env.NOTIFICATION_URL || 'http://localhost:3007',
  },
};
