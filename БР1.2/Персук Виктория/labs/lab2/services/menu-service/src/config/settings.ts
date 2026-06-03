import { env } from 'process';

class Settings {
    APP_HOST: string = env.APP_HOST || '0.0.0.0';
    APP_PORT: number = parseInt(env.APP_PORT) || 3004;
    APP_PROTOCOL: string = env.APP_PROTOCOL || 'http';
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api/v1';

    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = parseInt(env.DB_PORT) || 5432;
    DB_NAME = env.DB_NAME || 'menu_db';
    DB_USER = env.DB_USER || 'menu_db';
    DB_PASSWORD = env.DB_PASSWORD || 'menu_db';

    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'secret';

    RESTAURANT_SERVICE_URL = env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';
}

const SETTINGS = new Settings();
export default SETTINGS;
