import { env } from 'process';

class Settings {
    APP_HOST: string = env.APP_HOST || '0.0.0.0';
    APP_PORT: number = parseInt(env.APP_PORT) || 3005;
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api/v1';

    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = parseInt(env.DB_PORT) || 5437;
    DB_NAME = env.DB_NAME || 'messaging_db';
    DB_USER = env.DB_USER || 'messaging_db';
    DB_PASSWORD = env.DB_PASSWORD || 'messaging_db';

    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'supersecret';
    SERVICE_TOKEN = env.SERVICE_TOKEN || 'internal-service-token';
    USER_SERVICE_URL = env.USER_SERVICE_URL || 'http://user-service:3002';
}

const SETTINGS = new Settings();
export default SETTINGS;
