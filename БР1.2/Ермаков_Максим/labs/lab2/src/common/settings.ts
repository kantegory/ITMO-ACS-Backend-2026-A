import { env } from 'process';

const numberEnv = (name: string, fallback: number) =>
    Number.parseInt(env[name] || '', 10) || fallback;

export const SETTINGS = {
    APP_PROTOCOL: env.APP_PROTOCOL || 'http',

    GATEWAY_HOST: env.GATEWAY_HOST || '127.0.0.1',
    GATEWAY_PORT: numberEnv('GATEWAY_PORT', 8100),
    IDENTITY_HOST: env.IDENTITY_HOST || '127.0.0.1',
    IDENTITY_PORT: numberEnv('IDENTITY_PORT', 8101),
    CATALOG_HOST: env.CATALOG_HOST || '127.0.0.1',
    CATALOG_PORT: numberEnv('CATALOG_PORT', 8102),
    MENU_HOST: env.MENU_HOST || '127.0.0.1',
    MENU_PORT: numberEnv('MENU_PORT', 8103),
    RESERVATION_HOST: env.RESERVATION_HOST || '127.0.0.1',
    RESERVATION_PORT: numberEnv('RESERVATION_PORT', 8104),
    REVIEW_HOST: env.REVIEW_HOST || '127.0.0.1',
    REVIEW_PORT: numberEnv('REVIEW_PORT', 8105),

    IDENTITY_SERVICE_URL: env.IDENTITY_SERVICE_URL || 'http://127.0.0.1:8101',
    CATALOG_SERVICE_URL: env.CATALOG_SERVICE_URL || 'http://127.0.0.1:8102',
    MENU_SERVICE_URL: env.MENU_SERVICE_URL || 'http://127.0.0.1:8103',
    RESERVATION_SERVICE_URL: env.RESERVATION_SERVICE_URL || 'http://127.0.0.1:8104',
    REVIEW_SERVICE_URL: env.REVIEW_SERVICE_URL || 'http://127.0.0.1:8105',

    DB_HOST: env.DB_HOST || '127.0.0.1',
    DB_PORT: numberEnv('DB_PORT', 15432),
    DB_USER: env.DB_USER || 'maindb',
    DB_PASSWORD: env.DB_PASSWORD || 'maindb',
    IDENTITY_DB_NAME: env.IDENTITY_DB_NAME || 'identity_db',
    CATALOG_DB_NAME: env.CATALOG_DB_NAME || 'catalog_db',
    MENU_DB_NAME: env.MENU_DB_NAME || 'menu_db',
    RESERVATION_DB_NAME: env.RESERVATION_DB_NAME || 'reservation_db',
    REVIEW_DB_NAME: env.REVIEW_DB_NAME || 'review_db',

    JWT_SECRET_KEY: env.JWT_SECRET_KEY || 'secret',
    JWT_REFRESH_SECRET_KEY: env.JWT_REFRESH_SECRET_KEY || env.JWT_SECRET_KEY || 'secret',
    JWT_ACCESS_TOKEN_LIFETIME: numberEnv('JWT_ACCESS_TOKEN_LIFETIME', 60 * 60),
    JWT_REFRESH_TOKEN_LIFETIME: numberEnv('JWT_REFRESH_TOKEN_LIFETIME', 60 * 60 * 24 * 7),

    ADMIN_EMAIL: env.ADMIN_EMAIL || 'admin@restaurant-booking.local',
    ADMIN_PASSWORD: env.ADMIN_PASSWORD || 'admin12345',
    ADMIN_FIRST_NAME: env.ADMIN_FIRST_NAME || 'Admin',
    ADMIN_LAST_NAME: env.ADMIN_LAST_NAME || 'User',
    ADMIN_PHONE: env.ADMIN_PHONE || '+79990000000',
};
