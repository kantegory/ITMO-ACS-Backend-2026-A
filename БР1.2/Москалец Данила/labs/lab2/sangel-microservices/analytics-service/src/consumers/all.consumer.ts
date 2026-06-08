import { setupConsumer, Queues, Exchanges, RoutingKeys } from '../../event-bus';
import { getChannel } from '../../event-bus';
import axios from 'axios';
import { settings } from '../config/settings';

// Обработчик для всех событий
async function handleEvent(data: any, routingKey: string): Promise<void> {
  console.log(`Analytics received: ${routingKey}`, data);
  
  
  switch (routingKey) {
    case RoutingKeys.USER_REGISTERED:
      console.log(`New user registered: ${data.email} (ID: ${data.userId})`);
      break;
    case RoutingKeys.USER_ROLE_UPDATED:
      console.log(`User role changed: ${data.userId} ${data.oldRole} → ${data.newRole}`);
      break;
    case RoutingKeys.COMPANY_CREATED:
      console.log(`New company created: ${data.title} (Owner: ${data.ownerId})`);
      break;
    case RoutingKeys.SERVICE_CREATED:
      console.log(`New service created: ${data.name} (Price: ${data.price})`);
      break;
    case RoutingKeys.REQUEST_CREATED:
      console.log(`New request created: #${data.requestId} for service ${data.serviceId}`);
      break;
    case RoutingKeys.REQUEST_STATUS_CHANGED:
      console.log(`Request status changed: #${data.requestId} ${data.oldStatus} → ${data.newStatus}`);
      break;
    case RoutingKeys.REVIEW_CREATED:
      console.log(`New review created: Rating ${data.rating} for service ${data.serviceId}`);
      break;
    default:
      console.log(`Unknown event: ${routingKey}`);
  }
}

export async function startAnalyticsConsumer(): Promise<void> {
  // Объявляем exchanges
  const channel = await getChannel();
  await channel.assertExchange(Exchanges.USER, 'topic', { durable: true });
  await channel.assertExchange(Exchanges.COMPANY, 'topic', { durable: true });
  await channel.assertExchange(Exchanges.REQUEST, 'topic', { durable: true });
  await channel.assertExchange(Exchanges.REVIEW, 'topic', { durable: true });
  
  // Подписываемся на все события
  const bindings = [
    { exchange: Exchanges.USER, routingKey: 'user.*' },
    { exchange: Exchanges.COMPANY, routingKey: 'company.*' },
    { exchange: Exchanges.REQUEST, routingKey: 'request.*' },
    { exchange: Exchanges.REVIEW, routingKey: 'review.*' },
  ];
  
  await setupConsumer(Queues.ANALYTICS, bindings, handleEvent);
  console.log('Analytics Service: Consumer started for all events');
}