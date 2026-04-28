import { env } from 'process';

class Settings {
    APP_HOST: string = env.APP_HOST || 'localhost';
    APP_PORT: number = parseInt(env.APP_PORT || '8000', 10);
    APP_PROTOCOL: string = env.APP_PROTOCOL || 'http';
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api/v1';

    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = parseInt(env.DB_PORT || '15432', 10);
    DB_NAME = env.DB_NAME || 'maindb';
    DB_USER = env.DB_USER || 'maindb';
    DB_PASSWORD = env.DB_PASSWORD || 'maindb';
    DB_ENTITIES = env.DB_ENTITIES || 'src/models/*.entity.ts';
    DB_SUBSCRIBERS = env.DB_SUBSCRIBERS || 'src/models/*.subscriber.ts';

    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'secret';
    JWT_TOKEN_TYPE = env.JWT_TOKEN_TYPE || 'Bearer';
    JWT_ACCESS_TOKEN_LIFETIME: number = parseInt(
        env.JWT_ACCESS_TOKEN_LIFETIME || '3600',
        10,
    );
}

const SETTINGS = new Settings();

export default SETTINGS;