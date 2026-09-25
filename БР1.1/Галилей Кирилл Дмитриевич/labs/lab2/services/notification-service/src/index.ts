import express from 'express';
import amqp from 'amqplib';

const app = express();
app.use(express.json());

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE = 'restaurant_events';
const QUEUE = 'notifications_queue';

async function startConsumer() {
  while (true) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
      const q = await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(q.queue, EXCHANGE, 'reservation.*');

      console.log(`[notification-service] Connected! Listening for events on queue: ${QUEUE}`);
      channel.consume(q.queue, (msg) => {
        if (msg) {
          const event = JSON.parse(msg.content.toString());
          console.log(`[notification-service] EVENT RECEIVED [${msg.fields.routingKey}]:`, {
            reservationId: event.id,
            date: event.reservation_date,
            time: `${event.start_time} - ${event.end_time}`
          });
          console.log(`[EMAIL DISPATCHER] Sending confirmation to user ${event.user_id}... [OK]`);
          channel.ack(msg);
        }
      });
      break;
    } catch (err) {
      console.warn('[notification-service] RabbitMQ not ready yet, retrying in 3 seconds...');
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notification-service' }));

const PORT = 5004;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[notification-service] running on port ${PORT}`);
  startConsumer();
});
