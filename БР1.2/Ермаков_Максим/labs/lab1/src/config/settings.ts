import { env } from 'process';

class Settings {
    // application base settings
    APP_HOST: string = env.APP_HOST || 'localhost';
    APP_PORT: number = parseInt(env.APP_PORT) || 8000;
    APP_PROTOCOL: string = env.APP_PROTOCOL || 'http';
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
    JWT_REFRESH_SECRET_KEY = env.JWT_REFRESH_SECRET_KEY || this.JWT_SECRET_KEY;
    JWT_TOKEN_TYPE = env.JWT_TOKEN_TYPE || 'Bearer';
    JWT_ACCESS_TOKEN_LIFETIME: number =
        parseInt(env.JWT_ACCESS_TOKEN_LIFETIME) || 60 * 60;
    JWT_REFRESH_TOKEN_LIFETIME: number =
        parseInt(env.JWT_REFRESH_TOKEN_LIFETIME) || 60 * 60 * 24 * 7;

    // seed settings
    ADMIN_EMAIL = env.ADMIN_EMAIL || 'admin@restaurant-booking.local';
    ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'admin12345';
    ADMIN_FIRST_NAME = env.ADMIN_FIRST_NAME || 'Admin';
    ADMIN_LAST_NAME = env.ADMIN_LAST_NAME || 'User';
    ADMIN_PHONE = env.ADMIN_PHONE || '+79990000000';
}

const SETTINGS = new Settings();

export default SETTINGS;
