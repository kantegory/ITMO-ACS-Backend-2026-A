import { env } from 'process';

class Settings {
    APP_HOST: string = env.APP_HOST || '0.0.0.0';
    APP_PORT: number = parseInt(env.APP_PORT) || 3002;
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api/v1';

    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = parseInt(env.DB_PORT) || 5432;
    DB_NAME = env.DB_NAME || 'app_db';
    DB_USER = env.DB_USER || 'app_db';
    DB_PASSWORD = env.DB_PASSWORD || 'app_db';

    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'supersecret';
    SERVICE_TOKEN = env.SERVICE_TOKEN || 'internal-service-token';
    REVIEW_SERVICE_URL = env.REVIEW_SERVICE_URL || 'http://review-service:3006/api/v1';
}

const SETTINGS = new Settings();
export default SETTINGS;
