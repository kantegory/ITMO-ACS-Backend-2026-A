import { env } from 'process';

export type DatabaseConfig = {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
};

const toNumber = (value: string | undefined, fallback: number): number => {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

class Settings {
    APP_HOST = env.APP_HOST || 'localhost';
    APP_PROTOCOL = env.APP_PROTOCOL || 'http';
    APP_API_PREFIX = env.APP_API_PREFIX || '/api/v1';

    GATEWAY_PORT = toNumber(env.GATEWAY_PORT, 8000);
    AUTH_SERVICE_PORT = toNumber(env.AUTH_SERVICE_PORT, 8001);
    RECIPE_SERVICE_PORT = toNumber(env.RECIPE_SERVICE_PORT, 8002);
    INTERACTION_SERVICE_PORT = toNumber(env.INTERACTION_SERVICE_PORT, 8003);

    AUTH_SERVICE_URL = trimTrailingSlash(env.AUTH_SERVICE_URL || 'http://localhost:8001');
    RECIPE_SERVICE_URL = trimTrailingSlash(env.RECIPE_SERVICE_URL || 'http://localhost:8002');
    INTERACTION_SERVICE_URL = trimTrailingSlash(
        env.INTERACTION_SERVICE_URL || 'http://localhost:8003',
    );

    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'secret';
    JWT_TOKEN_TYPE = env.JWT_TOKEN_TYPE || 'Bearer';
    JWT_ACCESS_TOKEN_LIFETIME = toNumber(env.JWT_ACCESS_TOKEN_LIFETIME, 60 * 60 * 24);

    SERVICE_JWT_SECRET = env.SERVICE_JWT_SECRET || 'service-secret';
    SERVICE_TOKEN_LIFETIME = toNumber(env.SERVICE_TOKEN_LIFETIME, 5 * 60);

    RABBITMQ_URL = env.RABBITMQ_URL || 'amqp://localhost:5672';
    RABBITMQ_EXCHANGE = env.RABBITMQ_EXCHANGE || 'recipe-platform.events';
    RABBITMQ_RECIPE_DELETED_QUEUE =
        env.RABBITMQ_RECIPE_DELETED_QUEUE || 'interaction.recipe-deleted';
    RABBITMQ_RECIPE_DELETED_ROUTING_KEY =
        env.RABBITMQ_RECIPE_DELETED_ROUTING_KEY || 'recipe.deleted';

    AUTH_DB: DatabaseConfig = {
        host: env.AUTH_DB_HOST || 'localhost',
        port: toNumber(env.AUTH_DB_PORT, 15433),
        database: env.AUTH_DB_NAME || 'auth_db',
        username: env.AUTH_DB_USER || 'auth_db',
        password: env.AUTH_DB_PASSWORD || 'auth_db',
    };

    RECIPE_DB: DatabaseConfig = {
        host: env.RECIPE_DB_HOST || 'localhost',
        port: toNumber(env.RECIPE_DB_PORT, 15434),
        database: env.RECIPE_DB_NAME || 'recipe_db',
        username: env.RECIPE_DB_USER || 'recipe_db',
        password: env.RECIPE_DB_PASSWORD || 'recipe_db',
    };

    INTERACTION_DB: DatabaseConfig = {
        host: env.INTERACTION_DB_HOST || 'localhost',
        port: toNumber(env.INTERACTION_DB_PORT, 15435),
        database: env.INTERACTION_DB_NAME || 'interaction_db',
        username: env.INTERACTION_DB_USER || 'interaction_db',
        password: env.INTERACTION_DB_PASSWORD || 'interaction_db',
    };
}

const SETTINGS = new Settings();

export default SETTINGS;
