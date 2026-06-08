import dotenv from 'dotenv';
dotenv.config();

const SETTINGS = {
    APP_HOST: process.env.APP_HOST || '0.0.0.0',
    APP_PORT: parseInt(process.env.APP_PORT || '8001', 10),
    APP_API_PREFIX: process.env.APP_API_PREFIX || '/api/v1',
    INTERNAL_API_PREFIX: process.env.INTERNAL_API_PREFIX || '/internal',

    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || 'password',
    DB_NAME: process.env.DB_NAME || 'identity_db',

    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || 'default_secret',
    JWT_ACCESS_TOKEN_LIFETIME: process.env.JWT_ACCESS_TOKEN_LIFETIME || '1h',
};

export default SETTINGS;
