import dotenv from 'dotenv';
dotenv.config();

export const SETTINGS = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_NAME: process.env.DB_NAME || 'restaurant_booking_db',
  JWT_SECRET: process.env.JWT_SECRET || 'secret_jwt_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d'
};
