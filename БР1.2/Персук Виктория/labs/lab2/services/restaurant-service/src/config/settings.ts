import { env } from 'process';

class Settings {
    APP_HOST: string = env.APP_HOST || '0.0.0.0';
    APP_PORT: number = parseInt(env.APP_PORT) || 3002;
    APP_PROTOCOL: string = env.APP_PROTOCOL || 'http';
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api/v1';

    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = parseInt(env.DB_PORT) || 5432;
    DB_NAME = env.DB_NAME || 'restaurant_db';
    DB_USER = env.DB_USER || 'restaurant_db';
    DB_PASSWORD = env.DB_PASSWORD || 'restaurant_db';

    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'secret';

    RABBITMQ_URL = env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

    AUTH_SERVICE_URL = env.AUTH_SERVICE_URL || 'http://localhost:3001';
    RESERVATION_SERVICE_URL = env.RESERVATION_SERVICE_URL || 'http://localhost:3003';
    MENU_SERVICE_URL = env.MENU_SERVICE_URL || 'http://localhost:3004';
    REVIEW_SERVICE_URL = env.REVIEW_SERVICE_URL || 'http://localhost:3005';
}

const SETTINGS = new Settings();
export default SETTINGS;
