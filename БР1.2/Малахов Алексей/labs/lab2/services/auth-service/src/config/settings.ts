import { env } from 'process';

class Settings {
    APP_HOST: string = env.APP_HOST || '0.0.0.0';
    APP_PORT: number = parseInt(env.APP_PORT) || 3001;
    APP_PROTOCOL: string = env.APP_PROTOCOL || 'http';
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api/v1';

    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = parseInt(env.DB_PORT) || 5433;
    DB_NAME = env.DB_NAME || 'auth_db';
    DB_USER = env.DB_USER || 'auth_db';
    DB_PASSWORD = env.DB_PASSWORD || 'auth_db';

    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'supersecret';
    JWT_ACCESS_TOKEN_LIFETIME: number = parseInt(env.JWT_ACCESS_TOKEN_LIFETIME) || 300;
    JWT_REFRESH_TOKEN_LIFETIME: number = parseInt(env.JWT_REFRESH_TOKEN_LIFETIME) || 604800;

    SERVICE_TOKEN = env.SERVICE_TOKEN || 'internal-service-token';
    USER_SERVICE_URL = env.USER_SERVICE_URL || 'http://user-service:3002/api/v1';
}

const SETTINGS = new Settings();
export default SETTINGS;
