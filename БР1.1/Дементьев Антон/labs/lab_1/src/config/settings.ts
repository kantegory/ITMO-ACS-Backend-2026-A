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
    JWT_TOKEN_TYPE = env.JWT_TOKEN_TYPE || 'Bearer';
    JWT_ACCESS_TOKEN_LIFETIME: number =
        parseInt(env.JWT_ACCESS_TOKEN_LIFETIME) || 60 * 15;
    JWT_REFRESH_TOKEN_LIFETIME_DAYS: number =
        parseInt(env.JWT_REFRESH_TOKEN_LIFETIME_DAYS) || 14;

    // одноразовые коды из писем
    VERIFICATION_CODE_TTL_MINUTES: number =
        parseInt(env.VERIFICATION_CODE_TTL_MINUTES) || 15;

    // ограничение частоты запросов на чувствительных эндпоинтах
    RATE_LIMIT_MAX: number = parseInt(env.RATE_LIMIT_MAX) || 10;
    RATE_LIMIT_WINDOW_SECONDS: number =
        parseInt(env.RATE_LIMIT_WINDOW_SECONDS) || 60;

    // ТОЛЬКО ДЛЯ ТЕСТОВ: включает GET /dev/mailbox с кодами из писем (для Postman)
    MAIL_DEBUG: boolean = env.MAIL_DEBUG === 'true';

    // заполнить справочники (отрасли, навыки) при первом запуске
    SEED_ON_START: boolean = env.SEED_ON_START !== 'false';
}

const SETTINGS = new Settings();

export default SETTINGS;
