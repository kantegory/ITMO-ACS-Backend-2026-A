import { env } from 'process';
class Settings {
    APP_HOST = env.APP_HOST || 'localhost';
    APP_PORT = parseInt(env.APP_PORT || '8002');
    APP_API_PREFIX = env.APP_API_PREFIX || '/api';
    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = parseInt(env.DB_PORT || '5432');
    DB_NAME = env.DB_NAME || 'recipes_db';
    DB_USER = env.DB_USER || 'postgres';
    DB_PASSWORD = env.DB_PASSWORD || 'admin';
    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'secret';
    JWT_ACCESS_TOKEN_LIFETIME = parseInt(env.JWT_ACCESS_TOKEN_LIFETIME || '300');
    RECIPE_SERVICE_URL = env.RECIPE_SERVICE_URL || 'http://localhost:8002/api';
}
export default new Settings();
