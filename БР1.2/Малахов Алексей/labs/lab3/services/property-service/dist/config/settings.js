"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
class Settings {
    constructor() {
        this.APP_HOST = process_1.env.APP_HOST || '0.0.0.0';
        this.APP_PORT = parseInt(process_1.env.APP_PORT) || 3003;
        this.APP_API_PREFIX = process_1.env.APP_API_PREFIX || '/api/v1';
        this.DB_HOST = process_1.env.DB_HOST || 'localhost';
        this.DB_PORT = parseInt(process_1.env.DB_PORT) || 5435;
        this.DB_NAME = process_1.env.DB_NAME || 'property_db';
        this.DB_USER = process_1.env.DB_USER || 'property_db';
        this.DB_PASSWORD = process_1.env.DB_PASSWORD || 'property_db';
        this.JWT_SECRET_KEY = process_1.env.JWT_SECRET_KEY || 'supersecret';
        this.SERVICE_TOKEN = process_1.env.SERVICE_TOKEN || 'internal-service-token';
        this.USER_SERVICE_URL = process_1.env.USER_SERVICE_URL || 'http://user-service:3002/api/v1';
        this.REVIEW_SERVICE_URL = process_1.env.REVIEW_SERVICE_URL || 'http://review-service:3006/api/v1';
        this.RABBITMQ_URL = process_1.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
    }
}
const SETTINGS = new Settings();
exports.default = SETTINGS;
