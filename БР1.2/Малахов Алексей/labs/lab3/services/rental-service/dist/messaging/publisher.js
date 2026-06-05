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
exports.RENTAL_EVENTS_QUEUE = void 0;
exports.connectPublisher = connectPublisher;
exports.publishRentalStatusChanged = publishRentalStatusChanged;
const amqplib_1 = __importDefault(require("amqplib"));
const settings_1 = __importDefault(require("../config/settings"));
exports.RENTAL_EVENTS_QUEUE = 'rental_events';
let channel = null;
function connectPublisher() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const connection = yield amqplib_1.default.connect(settings_1.default.RABBITMQ_URL);
            channel = yield connection.createChannel();
            yield channel.assertQueue(exports.RENTAL_EVENTS_QUEUE, { durable: true });
            console.log('[rental-service] RabbitMQ publisher connected');
            connection.on('close', () => {
                console.warn('[rental-service] RabbitMQ connection closed, reconnecting...');
                channel = null;
                setTimeout(connectPublisher, 5000);
            });
            connection.on('error', (err) => {
                console.error('[rental-service] RabbitMQ error:', err.message);
            });
        }
        catch (err) {
            console.error('[rental-service] RabbitMQ connect failed, retrying in 5s:', err.message);
            setTimeout(connectPublisher, 5000);
        }
    });
}
function publishRentalStatusChanged(rentalId, propertyId, propertyStatus) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!channel) {
            console.warn('[rental-service] RabbitMQ not ready, status update skipped for property', propertyId);
            return;
        }
        const payload = JSON.stringify({
            event: 'rental.status_changed',
            rental_id: rentalId,
            property_id: propertyId,
            property_status: propertyStatus,
        });
        channel.sendToQueue(exports.RENTAL_EVENTS_QUEUE, Buffer.from(payload), { persistent: true });
        console.log(`[rental-service] Published → ${exports.RENTAL_EVENTS_QUEUE}: ${payload}`);
    });
}
