import 'dotenv/config';

export const settings = {
  host: process.env.APP_HOST || '0.0.0.0',
  port: Number(process.env.APP_PORT || 3010),
  apiPrefix: process.env.APP_API_PREFIX || '/api/v1',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 15439),
    name: process.env.DB_NAME || 'review_db',
    user: process.env.DB_USER || 'review_db',
    password: process.env.DB_PASSWORD || 'review_db',
  },
};
