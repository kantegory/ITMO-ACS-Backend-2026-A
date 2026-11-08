import { env } from 'process';

const toNumber = (value: string | undefined, fallback: number): number => {
    const parsed = Number.parseInt(value ?? '', 10);

    if (Number.isNaN(parsed)) {
        return fallback;
    }

    return parsed;
};

class Settings {
    APP_HOST = env.APP_HOST || 'localhost';
    APP_PORT = toNumber(env.APP_PORT, 8000);
    APP_PROTOCOL = env.APP_PROTOCOL || 'http';
    APP_API_PREFIX = env.APP_API_PREFIX || '/api/v1';

    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = toNumber(env.DB_PORT, 15432);
    DB_NAME = env.DB_NAME || 'maindb';
    DB_USER = env.DB_USER || 'maindb';
    DB_PASSWORD = env.DB_PASSWORD || 'maindb';

    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'secret';
    JWT_TOKEN_TYPE = env.JWT_TOKEN_TYPE || 'Bearer';
    JWT_ACCESS_TOKEN_LIFETIME = toNumber(env.JWT_ACCESS_TOKEN_LIFETIME, 60 * 60 * 24);
}

const SETTINGS = new Settings();

export default SETTINGS;
