const amqp = require('amqplib');

const rabbitUrl = () => process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const exchangeName = () => process.env.RABBITMQ_EXCHANGE || 'restaurant.events';

const startConsumer = async ({ queue, bindings, handler, retryMs = 5000 }) => {
  const connect = async () => {
    try {
      const connection = await amqp.connect(rabbitUrl());
      const channel = await connection.createChannel();

      await channel.assertExchange(exchangeName(), 'topic', { durable: true });
      await channel.assertQueue(queue, { durable: true });

      for (const binding of bindings) {
        await channel.bindQueue(queue, exchangeName(), binding);
      }

      await channel.prefetch(10);

      channel.consume(queue, async (message) => {
        if (!message) return;

        try {
          const event = JSON.parse(message.content.toString());
          await handler(event, message.fields.routingKey);
          channel.ack(message);
        } catch (error) {
          console.error(`RabbitMQ consumer error in ${queue}: ${error.message}`);
          channel.nack(message, false, false);
        }
      });

      connection.on('close', () => {
        console.warn(`RabbitMQ connection closed for ${queue}`);
        setTimeout(connect, retryMs);
      });

      connection.on('error', (error) => {
        console.warn(`RabbitMQ connection error for ${queue}: ${error.message}`);
      });

      console.log(`RabbitMQ consumer started: ${queue}`);
    } catch (error) {
      console.warn(`RabbitMQ consumer unavailable for ${queue}: ${error.message}`);
      setTimeout(connect, retryMs);
    }
  };

  await connect();
};

module.exports = { startConsumer };
