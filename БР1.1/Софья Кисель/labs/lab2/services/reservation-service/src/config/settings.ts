import 'dotenv/config';

export const settings = {
  host: process.env.APP_HOST || '0.0.0.0',
  port: Number(process.env.APP_PORT || 3003),
  apiPrefix: process.env.APP_API_PREFIX || '/api/v1',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 15437),
    name: process.env.DB_NAME || 'reservation_db',
    user: process.env.DB_USER || 'reservation_db',
    password: process.env.DB_PASSWORD || 'reservation_db',
  },
};
