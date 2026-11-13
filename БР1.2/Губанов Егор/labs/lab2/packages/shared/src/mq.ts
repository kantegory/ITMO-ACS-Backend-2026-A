import amqplib, { Channel, Connection } from "amqplib";

export const DEAL_EVENTS_QUEUE = "rent.deal.events";

export type DealCreatedEvent = {
  type: "deal.created";
  deal_id: string;
  property_id: string;
  tenant_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  total_price: string;
};

export type DealStatusChangedEvent = {
  type: "deal.status_changed";
  deal_id: string;
  property_id: string;
  tenant_id: string;
  owner_id: string;
  status: string;
  previous_status: string;
};

export type DealEvent = DealCreatedEvent | DealStatusChangedEvent;

let channel: Channel | null = null;
let connection: Connection | null = null;

export function rabbitUrl(): string {
  return process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
}

export async function connectMq(): Promise<Channel> {
  if (channel) return channel;
  connection = await amqplib.connect(rabbitUrl());
  channel = await connection.createChannel();
  await channel.assertQueue(DEAL_EVENTS_QUEUE, { durable: true });
  return channel;
}

export async function publishDealEvent(event: DealEvent): Promise<void> {
  const ch = await connectMq();
  ch.sendToQueue(DEAL_EVENTS_QUEUE, Buffer.from(JSON.stringify(event)), {
    persistent: true,
  });
}

export async function consumeDealEvents(
  handler: (event: DealEvent) => Promise<void>
): Promise<void> {
  const ch = await connectMq();
  await ch.consume(DEAL_EVENTS_QUEUE, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString()) as DealEvent;
      await handler(event);
      ch.ack(msg);
    } catch (e) {
      console.error("deal event consumer error", e);
      ch.nack(msg, false, false);
    }
  });
}
