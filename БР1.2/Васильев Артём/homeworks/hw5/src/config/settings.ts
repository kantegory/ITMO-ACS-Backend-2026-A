import { env } from 'process';

class Settings {
    // application base settings
    APP_HOST: string = env.APP_HOST || 'localhost';
    APP_PORT: number = parseInt(env.APP_PORT) || 8000;
    APP_PROTOCOL: string = env.APP_PROTOCOL || 'http';
    APP_CONTROLLERS_PATH: string =
        env.APP_CONTROLLERS_PATH || '/controllers/*.controller.js';
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api/v1';

    // db connection settings
    DB_HOST = env.DB_HOST || env.POSTGRES_HOST || 'localhost';
    DB_PORT = parseInt(env.DB_PORT || env.POSTGRES_PORT) || 15432;
    DB_NAME = env.DB_NAME || env.POSTGRES_DB || 'maindb';
    DB_USER = env.DB_USER || env.POSTGRES_USER || 'maindb';
    DB_PASSWORD = env.DB_PASSWORD || env.POSTGRES_PASSWORD || 'maindb';
    DB_ENTITIES = env.DB_ENTITIES || 'dist/models/*.entity.js';
    DB_SUBSCRIBERS = env.DB_SUBSCRIBERS || 'dist/models/*.subscriber.js';
    DB_MIGRATIONS = env.DB_MIGRATIONS || 'dist/migrations/*.js';

    // jwt settings
    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'secret';
    JWT_TOKEN_TYPE = env.JWT_TOKEN_TYPE || 'Bearer';
    JWT_ACCESS_TOKEN_LIFETIME: number =
        parseInt(env.JWT_ACCESS_TOKEN_LIFETIME) || 60 * 5;
}

const SETTINGS = new Settings();

export default SETTINGS;
