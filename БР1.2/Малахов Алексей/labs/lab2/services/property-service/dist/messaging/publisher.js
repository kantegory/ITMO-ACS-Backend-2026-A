"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROPERTY_EVENTS_QUEUE = void 0;
exports.connectPublisher = connectPublisher;
exports.publishPropertyStatusChanged = publishPropertyStatusChanged;
const amqplib_1 = __importDefault(require("amqplib"));
const settings_1 = __importDefault(require("../config/settings"));
exports.PROPERTY_EVENTS_QUEUE = 'property_events';
let channel = null;
function connectPublisher() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const connection = yield amqplib_1.default.connect(settings_1.default.RABBITMQ_URL);
            channel = yield connection.createChannel();
            yield channel.assertQueue(exports.PROPERTY_EVENTS_QUEUE, { durable: true });
            console.log('[property-service] RabbitMQ publisher connected');
            connection.on('close', () => {
                console.warn('[property-service] RabbitMQ publisher connection closed, reconnecting...');
                channel = null;
                setTimeout(connectPublisher, 5000);
            });
            connection.on('error', (err) => {
                console.error('[property-service] RabbitMQ publisher error:', err.message);
            });
        }
        catch (err) {
            console.error('[property-service] RabbitMQ publisher connect failed, retrying in 5s:', err.message);
            setTimeout(connectPublisher, 5000);
        }
    });
}
function publishPropertyStatusChanged(propertyId, propertyStatus, rentalId, ownerId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!channel) {
            console.warn('[property-service] RabbitMQ publisher not ready, skipping publish for property', propertyId);
            return;
        }
        const payload = JSON.stringify({
            event: 'property.status_changed',
            property_id: propertyId,
            property_status: propertyStatus,
            rental_id: rentalId,
            owner_id: ownerId,
        });
        channel.sendToQueue(exports.PROPERTY_EVENTS_QUEUE, Buffer.from(payload), { persistent: true });
        console.log(`[property-service] Published → ${exports.PROPERTY_EVENTS_QUEUE}: ${payload}`);
    });
}
