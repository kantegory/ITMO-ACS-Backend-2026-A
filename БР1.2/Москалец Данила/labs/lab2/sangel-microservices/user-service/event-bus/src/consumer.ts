import { getChannel } from './connection';
import { Exchanges, Queues } from './events';

export async function setupConsumer(
  queueName: string,
  bindings: { exchange: string; routingKey: string }[],
  handler: (data: any, routingKey: string) => Promise<void>
): Promise<void> {
  const channel = await getChannel();
  
  // Объявляем очередь
  await channel.assertQueue(queueName, { durable: true });
  
  // Привязываем к exchanges
  for (const binding of bindings) {
    await channel.bindQueue(queueName, binding.exchange, binding.routingKey);
    console.log(`🔗 Queue "${queueName}" bound to ${binding.exchange}:${binding.routingKey}`);
  }
  
  // Потребляем сообщения
  channel.consume(queueName, async (msg) => {
    if (msg) {
      try {
        const content = JSON.parse(msg.content.toString());
        await handler(content, msg.fields.routingKey);
        channel.ack(msg);
      } catch (error) {
        console.error(`❌ Error processing message:`, error);
        channel.nack(msg, false, true); // requeue
      }
    }
  });
  
  console.log(`🎧 Consumer started for queue: ${queueName}`);
}