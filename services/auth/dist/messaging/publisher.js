"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishUserRegistered = publishUserRegistered;
const amqplib_1 = __importDefault(require("amqplib"));
const env_1 = require("../config/env");
const EXCHANGE = "vacancies.events";
async function publishUserRegistered(payload) {
    const conn = await amqplib_1.default.connect(env_1.env.rabbitmqUrl);
    try {
        const channel = await conn.createChannel();
        await channel.assertExchange(EXCHANGE, "topic", { durable: true });
        const message = {
            event: "user.registered",
            timestamp: new Date().toISOString(),
            payload,
        };
        channel.publish(EXCHANGE, "user.registered", Buffer.from(JSON.stringify(message)), { persistent: true });
        await channel.close();
    }
    finally {
        await conn.close();
    }
}
