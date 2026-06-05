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
exports.startConsumer = startConsumer;
const amqplib_1 = __importDefault(require("amqplib"));
const settings_1 = __importDefault(require("../config/settings"));
const PROPERTY_EVENTS_QUEUE = 'property_events';
function startConsumer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const connection = yield amqplib_1.default.connect(settings_1.default.RABBITMQ_URL);
            const channel = yield connection.createChannel();
            yield channel.assertQueue(PROPERTY_EVENTS_QUEUE, { durable: true });
            channel.prefetch(1);
            console.log('[review-service] RabbitMQ consumer started');
            connection.on('close', () => {
                console.warn('[review-service] RabbitMQ connection closed, reconnecting...');
                setTimeout(startConsumer, 5000);
            });
            connection.on('error', (err) => {
                console.error('[review-service] RabbitMQ error:', err.message);
            });
            channel.consume(PROPERTY_EVENTS_QUEUE, (msg) => __awaiter(this, void 0, void 0, function* () {
                if (!msg)
                    return;
                try {
                    const data = JSON.parse(msg.content.toString());
                    if (data.event === 'property.status_changed') {
                        if (data.property_status === 'active') {
                            console.log(`[review-service] Rental ${data.rental_id} completed —` +
                                ` review is now available for landlord ${data.owner_id}`);
                        }
                        else {
                            console.log(`[review-service] Property ${data.property_id} is now ${data.property_status}` +
                                ` (rental ${data.rental_id})`);
                        }
                    }
                    channel.ack(msg);
                }
                catch (err) {
                    console.error('[review-service] Failed to process message:', err);
                    channel.nack(msg, false, false);
                }
            }));
        }
        catch (err) {
            console.error('[review-service] RabbitMQ connect failed, retrying in 5s:', err.message);
            setTimeout(startConsumer, 5000);
        }
    });
}
