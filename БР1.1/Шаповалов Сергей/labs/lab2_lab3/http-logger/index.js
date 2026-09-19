const amqp = require('amqplib');
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';

async function start() {
  while (true) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      conn.on('error', e => console.error('AMQP conn error', e));
      conn.on('close', () => console.warn('AMQP conn closed, reconnecting...'));
      const ch = await conn.createChannel();
      await ch.assertExchange('http.requests', 'fanout', { durable: false });
      const q = await ch.assertQueue('', { exclusive: true });
      await ch.bindQueue(q.queue, 'http.requests', '');
      ch.consume(q.queue, msg => {
        if (msg) {
          try {
            console.log('http-logger received', msg.content.toString());
          } catch (e) {
            console.error('Failed to parse message', e);
          }
          ch.ack(msg);
        }
      });
      console.log('http-logger connected to RabbitMQ');
      return;
    } catch (err) {
      console.error('http-logger connect failed:', err.message || err);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

start();
