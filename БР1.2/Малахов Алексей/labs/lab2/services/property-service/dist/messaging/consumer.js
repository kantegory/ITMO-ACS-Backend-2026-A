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
const data_source_1 = __importDefault(require("../config/data-source"));
const property_entity_1 = require("../models/property.entity");
const publisher_1 = require("./publisher");
const RENTAL_EVENTS_QUEUE = 'rental_events';
function startConsumer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const connection = yield amqplib_1.default.connect(settings_1.default.RABBITMQ_URL);
            const channel = yield connection.createChannel();
            yield channel.assertQueue(RENTAL_EVENTS_QUEUE, { durable: true });
            channel.prefetch(1);
            console.log('[property-service] RabbitMQ consumer started');
            connection.on('close', () => {
                console.warn('[property-service] RabbitMQ consumer connection closed, reconnecting...');
                setTimeout(startConsumer, 5000);
            });
            connection.on('error', (err) => {
                console.error('[property-service] RabbitMQ consumer error:', err.message);
            });
            channel.consume(RENTAL_EVENTS_QUEUE, (msg) => __awaiter(this, void 0, void 0, function* () {
                if (!msg)
                    return;
                try {
                    const data = JSON.parse(msg.content.toString());
                    if (data.event === 'rental.status_changed') {
                        const repo = data_source_1.default.getRepository(property_entity_1.Property);
                        const property = yield repo.findOneBy({ id: data.property_id });
                        if (property) {
                            property.status = data.property_status;
                            yield repo.save(property);
                            console.log(`[property-service] Property ${data.property_id} status → ${data.property_status}` +
                                ` (rental ${data.rental_id})`);
                            yield (0, publisher_1.publishPropertyStatusChanged)(property.id, data.property_status, data.rental_id, property.ownerId);
                        }
                    }
                    channel.ack(msg);
                }
                catch (err) {
                    console.error('[property-service] Failed to process message:', err);
                    channel.nack(msg, false, false);
                }
            }));
        }
        catch (err) {
            console.error('[property-service] RabbitMQ connect failed, retrying in 5s:', err.message);
            setTimeout(startConsumer, 5000);
        }
    });
}
