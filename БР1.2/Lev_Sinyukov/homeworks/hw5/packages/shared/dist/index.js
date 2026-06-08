"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.buildError = exports.buildHealth = exports.DEFAULT_TIMEOUT_MS = exports.EXCHANGE_NAME = void 0;
exports.connectRabbit = connectRabbit;
exports.createRpcClient = createRpcClient;
exports.registerRpcHandler = registerRpcHandler;
exports.parseRpcResult = parseRpcResult;
const amqplib_1 = __importDefault(require("amqplib"));
const crypto_1 = require("crypto");
exports.EXCHANGE_NAME = "restaurant.booking.topic";
exports.DEFAULT_TIMEOUT_MS = 5000;
const buildHealth = (service) => ({
    service,
    status: "ok",
    timestamp: new Date().toISOString(),
});
exports.buildHealth = buildHealth;
const buildError = (code, message, details) => ({
    code,
    message,
    trace_id: (0, crypto_1.randomUUID)(),
    details,
});
exports.buildError = buildError;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.delay = delay;
async function connectRabbit(serviceName, amqpUrl = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672") {
    let lastError;
    for (let attempt = 1; attempt <= 20; attempt += 1) {
        try {
            const connection = await amqplib_1.default.connect(amqpUrl, {
                clientProperties: {
                    connection_name: serviceName,
                },
            });
            const channel = await connection.createChannel();
            await channel.assertExchange(exports.EXCHANGE_NAME, "topic", { durable: false });
            return { connection, channel };
        }
        catch (error) {
            lastError = error;
            await (0, exports.delay)(1000);
        }
    }
    throw lastError;
}
async function createRpcClient(channel, replyQueueName) {
    const pending = new Map();
    const assertedQueue = replyQueueName
        ? await channel.assertQueue(replyQueueName, { durable: false, autoDelete: false })
        : await channel.assertQueue("", { exclusive: true, autoDelete: true });
    await channel.consume(assertedQueue.queue, (message) => {
        if (!message?.properties.correlationId) {
            return;
        }
        const request = pending.get(message.properties.correlationId);
        if (!request) {
            return;
        }
        clearTimeout(request.timeout);
        pending.delete(message.properties.correlationId);
        try {
            request.resolve(JSON.parse(message.content.toString("utf-8")));
        }
        catch (error) {
            request.reject(error);
        }
    }, { noAck: true });
    return {
        request(routingKey, payload, timeoutMs = exports.DEFAULT_TIMEOUT_MS) {
            return new Promise((resolve, reject) => {
                const correlationId = (0, crypto_1.randomUUID)();
                const timeout = setTimeout(() => {
                    pending.delete(correlationId);
                    reject(new Error(`RPC timeout for ${routingKey}`));
                }, timeoutMs);
                pending.set(correlationId, { resolve, reject, timeout });
                channel.publish(exports.EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(payload)), {
                    correlationId,
                    replyTo: assertedQueue.queue,
                    contentType: "application/json",
                });
            });
        },
    };
}
async function registerRpcHandler(channel, queueName, routingKey, handler) {
    await channel.assertQueue(queueName, { durable: false });
    await channel.bindQueue(queueName, exports.EXCHANGE_NAME, routingKey);
    await channel.consume(queueName, async (message) => {
        if (!message) {
            return;
        }
        try {
            const payload = JSON.parse(message.content.toString("utf-8"));
            const response = await handler(payload);
            if (message.properties.replyTo) {
                channel.sendToQueue(message.properties.replyTo, Buffer.from(JSON.stringify(response)), {
                    correlationId: message.properties.correlationId,
                    contentType: "application/json",
                });
            }
            channel.ack(message);
        }
        catch (error) {
            const response = {
                ok: false,
                error: error instanceof Error ? error.message : "Unknown RPC handler error",
            };
            if (message.properties.replyTo) {
                channel.sendToQueue(message.properties.replyTo, Buffer.from(JSON.stringify(response)), {
                    correlationId: message.properties.correlationId,
                    contentType: "application/json",
                });
            }
            channel.ack(message);
        }
    });
}
function parseRpcResult(payload) {
    if (payload && payload.ok === false && payload.error) {
        throw new Error(payload.error);
    }
    return payload;
}
