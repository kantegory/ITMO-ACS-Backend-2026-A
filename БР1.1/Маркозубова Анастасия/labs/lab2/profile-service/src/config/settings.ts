import { env } from 'process';

const defaultDatabases: Record<string, string> = {
    monolith: 'job_board_monolith',
    auth: 'auth_db',
    profile: 'profile_db',
    resume: 'resume_db',
    vacancy: 'vacancy_db',
    application: 'application_db',
    reference: 'reference_db',
};

class Settings {
    SERVICE_NAME = defaultDatabases[env.SERVICE_NAME || '']
        ? env.SERVICE_NAME || 'monolith'
        : 'monolith';

    // application base settings
    APP_HOST: string = env.APP_HOST || 'localhost';
    APP_PORT: number = parseInt(env.APP_PORT) || 8000;
    APP_PROTOCOL: string = env.APP_PROTOCOL || 'http';
    APP_CONTROLLERS_PATH: string =
        env.APP_CONTROLLERS_PATH || '/controllers/*.controller.js';
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api';

    // db connection settings
    DB_HOST = env.DB_HOST || 'localhost';
    DB_PORT = parseInt(env.DB_PORT) || 15432;
    DB_NAME = env.DB_NAME || defaultDatabases[this.SERVICE_NAME];
    DB_USER = env.DB_USER || 'postgres';
    DB_PASSWORD = env.DB_PASSWORD || '1234';
    DB_ENTITIES = env.DB_ENTITIES || 'dist/models/*.entity.js';
    DB_SUBSCRIBERS = env.DB_SUBSCRIBERS || 'dist/models/*.subscriber.js';
    DB_RESET_ON_START = env.DB_RESET_ON_START === 'true';
    SEED_DEMO_DATA_ON_START =
        env.SEED_DEMO_DATA_ON_START === undefined
            ? true
            : env.SEED_DEMO_DATA_ON_START === 'true';

    // jwt settings
    JWT_SECRET_KEY = env.JWT_SECRET_KEY || 'secret';
    JWT_TOKEN_TYPE = env.JWT_SECRET_KEY || 'Bearer';
    JWT_ACCESS_TOKEN_LIFETIME: number =
        parseInt(env.JWT_ACCESS_TOKEN_LIFETIME) || 60 * 5;

    AUTH_SERVICE_URL = env.AUTH_SERVICE_URL || 'http://localhost:8001/api';
    PROFILE_SERVICE_URL =
        env.PROFILE_SERVICE_URL || 'http://localhost:8002/api';
    RESUME_SERVICE_URL = env.RESUME_SERVICE_URL || 'http://localhost:8003/api';
    VACANCY_SERVICE_URL =
        env.VACANCY_SERVICE_URL || 'http://localhost:8004/api';
    APPLICATION_SERVICE_URL =
        env.APPLICATION_SERVICE_URL || 'http://localhost:8005/api';
    REFERENCE_SERVICE_URL =
        env.REFERENCE_SERVICE_URL || 'http://localhost:8006/api';
}

const SETTINGS = new Settings();

export default SETTINGS;
