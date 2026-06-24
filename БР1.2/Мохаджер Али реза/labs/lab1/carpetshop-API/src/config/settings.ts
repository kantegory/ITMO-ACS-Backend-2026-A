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
    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = parseInt(env.DB_PORT) || 15432;
    DB_NAME = env.DB_NAME || 'maindb';
    DB_USER = env.DB_USER || 'maindb';
    DB_PASSWORD = env.DB_PASSWORD || 'maindb';
    DB_ENTITIES = env.DB_ENTITIES || 'dist/models/*.entity.js';
    DB_SUBSCRIBERS = env.DB_SUBSCRIBERS || 'dist/models/*.subscriber.js';

    // jwt settings
    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'secret';
    JWT_TOKEN_TYPE = env.JWT_SECRET_KEY || 'Bearer';
    JWT_ACCESS_TOKEN_LIFETIME: number =
        parseInt(env.JWT_ACCESS_TOKEN_LIFETIME) || 60 * 5;

    // bootstrap admin (optional, for first-time setup)
    INIT_ADMIN: boolean = (env.INIT_ADMIN || '').toLowerCase() === 'true';
    INIT_ADMIN_EMAIL: string | undefined = env.INIT_ADMIN_EMAIL;
    INIT_ADMIN_PASSWORD: string | undefined = env.INIT_ADMIN_PASSWORD;
    INIT_ADMIN_FIRST_NAME: string = env.INIT_ADMIN_FIRST_NAME || 'Admin';
    INIT_ADMIN_LAST_NAME: string = env.INIT_ADMIN_LAST_NAME || 'User';
}

const SETTINGS = new Settings();

export default SETTINGS;
