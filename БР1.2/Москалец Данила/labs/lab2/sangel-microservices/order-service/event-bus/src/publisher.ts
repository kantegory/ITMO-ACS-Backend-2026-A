import { getChannel } from './connection';
import { Exchanges } from './events';

// Объявляем exchanges при старте
export async function setupExchanges(): Promise<void> {
  const channel = await getChannel();
  
  for (const exchange of Object.values(Exchanges)) {
    await channel.assertExchange(exchange, 'topic', { durable: true });
    console.log(`Exchange declared: ${exchange}`);
  }
}

export async function publishEvent(
  exchange: string,
  routingKey: string,
  data: any
): Promise<void> {
  try {
    const channel = await getChannel();
    const message = Buffer.from(JSON.stringify({
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    }));
    
    channel.publish(exchange, routingKey, message, { persistent: true });
    console.log(`📤 Event published: ${routingKey}`, data);
  } catch (error) {
    console.error(`Failed to publish event ${routingKey}:`, error);
  }
}