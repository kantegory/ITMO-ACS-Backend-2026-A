"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
class Settings {
    constructor() {
        this.APP_HOST = process_1.env.APP_HOST || '0.0.0.0';
        this.APP_PORT = parseInt(process_1.env.APP_PORT) || 3006;
        this.APP_PROTOCOL = process_1.env.APP_PROTOCOL || 'http';
        this.APP_API_PREFIX = process_1.env.APP_API_PREFIX || '/api/v1';
        this.DB_HOST = process_1.env.DB_HOST || 'localhost';
        this.DB_PORT = parseInt(process_1.env.DB_PORT) || 5432;
        this.DB_NAME = process_1.env.DB_NAME || 'app_db';
        this.DB_USER = process_1.env.DB_USER || 'app_db';
        this.DB_PASSWORD = process_1.env.DB_PASSWORD || 'app_db';
        this.JWT_SECRET_KEY = process_1.env.JWT_SECRET_KEY || 'supersecret';
        this.SERVICE_TOKEN = process_1.env.SERVICE_TOKEN || 'internal-service-token';
        this.RENTAL_SERVICE_URL = process_1.env.RENTAL_SERVICE_URL || 'http://rental-service:3004/api/v1';
        this.PROPERTY_SERVICE_URL = process_1.env.PROPERTY_SERVICE_URL || 'http://property-service:3003/api/v1';
        this.USER_SERVICE_URL = process_1.env.USER_SERVICE_URL || 'http://user-service:3002/api/v1';
        this.RABBITMQ_URL = process_1.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
    }
}
const SETTINGS = new Settings();
exports.default = SETTINGS;
