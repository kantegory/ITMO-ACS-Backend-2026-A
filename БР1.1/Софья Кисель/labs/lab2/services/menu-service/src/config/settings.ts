import { env } from 'process';

class Settings {
    APP_HOST: string = env.APP_HOST || '0.0.0.0';
    APP_PORT: number = parseInt(env.APP_PORT || '3004');
    APP_PROTOCOL: string = env.APP_PROTOCOL || 'http';
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api/v1';

    DB_HOST: string = env.DB_HOST || 'localhost';
    DB_PORT: number = parseInt(env.DB_PORT || '15436');
    DB_NAME: string = env.DB_NAME || 'menu_db';
    DB_USER: string = env.DB_USER || 'menu_db';
    DB_PASSWORD: string = env.DB_PASSWORD || 'menu_db';
}

const SETTINGS = new Settings();

export default SETTINGS;
