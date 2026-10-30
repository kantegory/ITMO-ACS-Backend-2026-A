import { env } from 'process';

class Settings {
    // application base settings
    APP_HOST: string = env.APP_HOST || '0.0.0.0';
    APP_PORT: number = parseInt(env.APP_PORT || '8000');
    APP_PROTOCOL: string = env.APP_PROTOCOL || 'http';
    APP_CONTROLLERS_PATH: string =
        env.APP_CONTROLLERS_PATH ||
        (env.NODE_ENV === 'development'
            ? '/controllers/*.controller.ts'
            : '/controllers/*.controller.js');
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api';

    // db connection settings
    DB_HOST: string = env.DATABASE_HOST || 'localhost';
    DB_PORT: number = parseInt(env.DATABASE_PORT || '5432');
    DB_NAME: string = env.POSTGRES_DB || 'maindb';
    DB_USER: string = env.POSTGRES_USER || 'maindb';
    DB_PASSWORD: string = env.POSTGRES_PASSWORD || 'maindb';
    DB_ENTITIES: string =
        env.DB_ENTITIES ||
        (env.NODE_ENV === 'development'
            ? 'src/models/*.entity.ts'
            : 'dist/models/*.entity.js');
    DB_SUBSCRIBERS: string =
        env.DB_SUBSCRIBERS ||
        (env.NODE_ENV === 'development'
            ? 'src/models/*.subscriber.ts'
            : 'dist/models/*.subscriber.js');


    // jwt settings
    JWT_SECRET_KEY: string = env.JWT_SECRET_KEY || 'secret';
    JWT_TOKEN_TYPE: string = env.JWT_TOKEN_TYPE || 'Bearer';
    JWT_ACCESS_TOKEN_LIFETIME: number = parseInt(env.JWT_ACCESS_TOKEN_LIFETIME || '3600');

    // service urls
    AUTH_SERVICE_URL: string = env.AUTH_SERVICE_URL || 'http://auth-service:8000';
    PROPERTY_SERVICE_URL: string = env.PROPERTY_SERVICE_URL || 'http://property-service:8001';
    BOOKING_SERVICE_URL: string = env.BOOKING_SERVICE_URL || 'http://booking-service:8002';
    ENGAGEMENT_SERVICE_URL: string = env.ENGAGEMENT_SERVICE_URL || 'http://engagement-service:8003';

    // rabbitmq
    RABBITMQ_URL: string = env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
}

const SETTINGS = new Settings();

export default SETTINGS;
