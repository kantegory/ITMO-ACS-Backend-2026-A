import { env } from 'process';

class Settings {
    // application base settings
    APP_HOST: string = env.APP_HOST || 'localhost';
    APP_PORT: number = parseInt(env.APP_PORT) || 8000;
    APP_PROTOCOL: string = env.APP_PROTOCOL || 'http';
    APP_CONTROLLERS_PATH: string =
        env.APP_CONTROLLERS_PATH || '/controllers/*.controller.js';
    APP_API_PREFIX: string = env.APP_API_PREFIX || '/api';

    // адреса других сервисов
    USER_SERVICE_URL = env.USER_SERVICE_URL || 'http://localhost:3001/api';
    RECIPE_SERVICE_URL = env.RECIPE_SERVICE_URL || 'http://localhost:3002/api';
    SOCIAL_SERVICE_URL = env.SOCIAL_SERVICE_URL || 'http://localhost:3003/api';

    // ключ, по которому сервисы узнают запросы от BFF и друг от друга
    INTERNAL_API_KEY = env.INTERNAL_API_KEY || 'change-me';

    // адрес RabbitMQ (очередь сообщений между сервисами)
    RABBITMQ_URL = env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

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
    JWT_TOKEN_TYPE = env.JWT_SECRET_KEY || 'Bearer';
    JWT_ACCESS_TOKEN_LIFETIME: number =
        parseInt(env.JWT_ACCESS_TOKEN_LIFETIME) || 60 * 5;
}

const SETTINGS = new Settings();

export default SETTINGS;
