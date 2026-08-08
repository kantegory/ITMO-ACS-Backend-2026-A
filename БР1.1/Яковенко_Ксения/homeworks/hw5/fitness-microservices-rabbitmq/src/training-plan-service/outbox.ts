import { IsNull } from 'typeorm';
import { IntegrationEvent, publishIntegrationEvent } from '../shared/rabbitmq';
import { plansDataSource } from './data-source';
import { OutboxEvent } from './entities/outbox-event.entity';

let dispatchInProgress = false;
let dispatcherStarted = false;

export async function dispatchPendingOutboxEvents(): Promise<void> {
  if (dispatchInProgress || !plansDataSource.isInitialized) return;
  dispatchInProgress = true;

  try {
    const repository = plansDataSource.getRepository(OutboxEvent);
    const events = await repository.find({
      where: { publishedAt: IsNull() },
      order: { createdAt: 'ASC' },
      take: 20,
    });

    for (const item of events) {
      const event: IntegrationEvent = {
        id: item.id,
        type: item.eventType,
        version: item.version,
        occurredAt: item.createdAt.toISOString(),
        payload: item.payload,
      };

      try {
        await publishIntegrationEvent(item.routingKey, event);
        item.publishedAt = new Date();
        item.lastError = null;
      } catch (error) {
        item.attempts += 1;
        item.lastError = error instanceof Error ? error.message : String(error);
        console.warn(`Outbox event ${item.id} was not published: ${item.lastError}`);
      }
      await repository.save(item);
    }
  } finally {
    dispatchInProgress = false;
  }
}

export function startOutboxDispatcher(): void {
  if (dispatcherStarted) return;
  dispatcherStarted = true;
  void dispatchPendingOutboxEvents();
  const timer = setInterval(() => {
    void dispatchPendingOutboxEvents();
  }, 3000);
  timer.unref();
}
