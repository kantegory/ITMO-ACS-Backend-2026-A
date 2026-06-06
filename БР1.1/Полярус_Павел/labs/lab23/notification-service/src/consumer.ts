import amqp from 'amqplib';

const EXCHANGE = 'jobby';
const QUEUES = {
  created: 'q.application.created',
  status: 'q.application.status',
};

export async function startConsumer(): Promise<void> {
  const conn = await amqp.connect(process.env.RABBITMQ_URL!);
  const channel = await conn.createChannel();

  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  await channel.assertQueue(QUEUES.created, { durable: true });
  await channel.bindQueue(QUEUES.created, EXCHANGE, 'application.created');

  await channel.assertQueue(QUEUES.status, { durable: true });
  await channel.bindQueue(QUEUES.status, EXCHANGE, 'application.status_changed');

  channel.prefetch(1);

  channel.consume(QUEUES.created, (msg) => {
    if (!msg) return;
    const payload = JSON.parse(msg.content.toString());
    console.log('[notification] application.created:', JSON.stringify(payload, null, 2));
    channel.ack(msg);
  });

  channel.consume(QUEUES.status, (msg) => {
    if (!msg) return;
    const payload = JSON.parse(msg.content.toString());
    console.log('[notification] application.status_changed:', JSON.stringify(payload, null, 2));
    channel.ack(msg);
  });

  console.log('notification-service listening on queues:', Object.values(QUEUES).join(', '));
}
