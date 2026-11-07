import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    user: process.env.DB_USER || 'jobsite',
    password: process.env.DB_PASSWORD || 'jobsite',
    name: process.env.DB_NAME || 'jobsite',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessExpiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN || '900', 10),
    refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '2592000', 10),
  },
};
