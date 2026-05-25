import { AppDataSource } from "./data-source";
import { Message } from "./entities/Message";
import {
  consumeDealEvents,
  DealEvent,
} from "../../../packages/shared/src/mq";

async function saveAutoMessage(
  senderId: string,
  receiverId: string,
  propertyId: string,
  content: string
) {
  const repo = AppDataSource.getRepository(Message);
  const m = repo.create({
    senderId,
    receiverId,
    propertyId,
    content,
    isRead: false,
  });
  await repo.save(m);
}

async function onDealEvent(event: DealEvent) {
  if (event.type === "deal.created") {
    const from = event.start_date.slice(0, 10);
    const to = event.end_date.slice(0, 10);
    await saveAutoMessage(
      event.tenant_id,
      event.owner_id,
      event.property_id,
      `Новая заявка на аренду (${from} — ${to}), сумма ${event.total_price} ₽.`
    );
    return;
  }
  if (event.type === "deal.status_changed") {
    const text =
      event.status === "ACTIVE"
        ? "Ваша заявка на аренду подтверждена владельцем."
        : event.status === "COMPLETED"
          ? "Сделка по аренде завершена."
          : `Статус сделки изменён: ${event.previous_status} → ${event.status}.`;
    await saveAutoMessage(
      event.owner_id,
      event.tenant_id,
      event.property_id,
      text
    );
  }
}

export async function startDealEventsConsumer() {
  await consumeDealEvents(onDealEvent);
  console.log("messaging: consuming queue rent.deal.events");
}
