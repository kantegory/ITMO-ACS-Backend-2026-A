"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startConsumer = startConsumer;
const amqplib_1 = __importDefault(require("amqplib"));
const env_1 = require("../config/env");
const profile_service_1 = require("../services/profile.service");
const EXCHANGE = "vacancies.events";
const QUEUE = "profile.user-registered";
async function startConsumer() {
    const conn = await amqplib_1.default.connect(env_1.env.rabbitmqUrl);
    const channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, "user.registered");
    channel.consume(QUEUE, async (msg) => {
        if (!msg)
            return;
        try {
            const event = JSON.parse(msg.content.toString());
            const payload = event.payload;
            if (payload?.role === "candidate" && payload?.user_id) {
                await profile_service_1.ProfileService.ensureProfile(payload.user_id);
            }
            channel.ack(msg);
        }
        catch (err) {
            console.error("Failed to process user.registered:", err);
            channel.nack(msg, false, false);
        }
    });
    console.log("Profile consumer listening on", QUEUE);
}
