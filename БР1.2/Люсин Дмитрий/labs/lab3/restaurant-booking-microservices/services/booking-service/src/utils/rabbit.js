const crypto = require('crypto');
const amqp = require('amqplib');

let channel = null;
let connection = null;
let isConnecting = false;

const rabbitUrl = () => process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const exchangeName = () => process.env.RABBITMQ_EXCHANGE || 'restaurant.events';

const connectRabbit = async () => {
  if (channel || isConnecting) return channel;

  isConnecting = true;

  try {
    connection = await amqp.connect(rabbitUrl());
    channel = await connection.createChannel();
    await channel.assertExchange(exchangeName(), 'topic', { durable: true });

    connection.on('close', () => {
      channel = null;
      connection = null;
    });

    connection.on('error', () => {
      channel = null;
      connection = null;
    });

    console.log(`RabbitMQ publisher connected: ${exchangeName()}`);
    return channel;
  } catch (error) {
    console.warn(`RabbitMQ publisher unavailable: ${error.message}`);
    channel = null;
    connection = null;
    return null;
  } finally {
    isConnecting = false;
  }
};

const publishEvent = async ({ type, routingKey, producer, payload }) => {
  const activeChannel = channel || await connectRabbit();

  if (!activeChannel) {
    console.warn(`RabbitMQ event was not published: ${type}`);
    return false;
  }

  const message = {
    event_id: crypto.randomUUID(),
    event_type: type,
    occurred_at: new Date().toISOString(),
    producer,
    payload
  };

  activeChannel.publish(
    exchangeName(),
    routingKey,
    Buffer.from(JSON.stringify(message)),
    { contentType: 'application/json', persistent: true }
  );

  console.log(`RabbitMQ event published: ${routingKey}`);
  return true;
};

module.exports = { connectRabbit, publishEvent };
