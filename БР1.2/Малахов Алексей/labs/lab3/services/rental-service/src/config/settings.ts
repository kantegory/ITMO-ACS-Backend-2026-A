import { env } from 'process';

class Settings {
    APP_HOST: string = env.APP_HOST || '0.0.0.0';
    APP_PORT: number = parseInt(env.APP_PORT) || 3004;
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api/v1';

    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = parseInt(env.DB_PORT) || 5432;
    DB_NAME = env.DB_NAME || 'app_db';
    DB_USER = env.DB_USER || 'app_db';
    DB_PASSWORD = env.DB_PASSWORD || 'app_db';

    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'supersecret';
    SERVICE_TOKEN = env.SERVICE_TOKEN || 'internal-service-token';
    PROPERTY_SERVICE_URL = env.PROPERTY_SERVICE_URL || 'http://property-service:3003/api/v1';
    USER_SERVICE_URL = env.USER_SERVICE_URL || 'http://user-service:3002/api/v1';
    RABBITMQ_URL = env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
}

const SETTINGS = new Settings();
export default SETTINGS;
