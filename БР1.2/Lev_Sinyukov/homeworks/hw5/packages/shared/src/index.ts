import amqplib, { Channel, Connection, Options } from "amqplib";
import { randomUUID } from "crypto";

export const EXCHANGE_NAME = "restaurant.booking.topic";
export const DEFAULT_TIMEOUT_MS = 5000;

export type ServiceHealth = {
  service: string;
  status: "ok";
  timestamp: string;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  trace_id: string;
  details?: Array<{ field: string; issue: string }>;
};

export type RpcHandler<TRequest, TResponse> = (payload: TRequest) => Promise<TResponse> | TResponse;

export type RpcClient = {
  request<TRequest, TResponse>(routingKey: string, payload: TRequest, timeoutMs?: number): Promise<TResponse>;
};

export const buildHealth = (service: string): ServiceHealth => ({
  service,
  status: "ok",
  timestamp: new Date().toISOString(),
});

export const buildError = (code: string, message: string, details?: ApiErrorBody["details"]): ApiErrorBody => ({
  code,
  message,
  trace_id: randomUUID(),
  details,
});

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function connectRabbit(serviceName: string, amqpUrl = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672") {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      const connection = await amqplib.connect(amqpUrl, {
        clientProperties: {
          connection_name: serviceName,
        },
      });
      const channel = await connection.createChannel();

      await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
      return { connection, channel };
    } catch (error) {
      lastError = error;
      await delay(1000);
    }
  }

  throw lastError;
}

export async function createRpcClient(channel: Channel, replyQueueName?: string): Promise<RpcClient> {
  const pending = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (reason?: unknown) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  const assertedQueue = replyQueueName
    ? await channel.assertQueue(replyQueueName, { durable: false, autoDelete: false })
    : await channel.assertQueue("", { exclusive: true, autoDelete: true });

  await channel.consume(
    assertedQueue.queue,
    (message) => {
      if (!message?.properties.correlationId) {
        return;
      }

      const request = pending.get(message.properties.correlationId);
      if (!request) {
        return;
      }

      clearTimeout(request.timeout);
      pending.delete(message.properties.correlationId);

      try {
        request.resolve(JSON.parse(message.content.toString("utf-8")));
      } catch (error) {
        request.reject(error);
      }
    },
    { noAck: true },
  );

  return {
    request<TRequest, TResponse>(routingKey: string, payload: TRequest, timeoutMs = DEFAULT_TIMEOUT_MS) {
      return new Promise<TResponse>((resolve, reject) => {
        const correlationId = randomUUID();
        const timeout = setTimeout(() => {
          pending.delete(correlationId);
          reject(new Error(`RPC timeout for ${routingKey}`));
        }, timeoutMs);

        pending.set(correlationId, { resolve, reject, timeout });

        channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(payload)), {
          correlationId,
          replyTo: assertedQueue.queue,
          contentType: "application/json",
        });
      });
    },
  };
}

export async function registerRpcHandler<TRequest, TResponse>(
  channel: Channel,
  queueName: string,
  routingKey: string,
  handler: RpcHandler<TRequest, TResponse>,
) {
  await channel.assertQueue(queueName, { durable: false });
  await channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);

  await channel.consume(queueName, async (message) => {
    if (!message) {
      return;
    }

    try {
      const payload = JSON.parse(message.content.toString("utf-8")) as TRequest;
      const response = await handler(payload);

      if (message.properties.replyTo) {
        channel.sendToQueue(
          message.properties.replyTo,
          Buffer.from(JSON.stringify(response)),
          {
            correlationId: message.properties.correlationId,
            contentType: "application/json",
          } satisfies Options.Publish,
        );
      }

      channel.ack(message);
    } catch (error) {
      const response = {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown RPC handler error",
      };

      if (message.properties.replyTo) {
        channel.sendToQueue(
          message.properties.replyTo,
          Buffer.from(JSON.stringify(response)),
          {
            correlationId: message.properties.correlationId,
            contentType: "application/json",
          } satisfies Options.Publish,
        );
      }

      channel.ack(message);
    }
  });
}

export function parseRpcResult<T extends { ok?: boolean; error?: string }>(payload: T): T {
  if (payload && payload.ok === false && payload.error) {
    throw new Error(payload.error);
  }

  return payload;
}

export type Restaurant = {
  id: number;
  name: string;
  city: string;
  cuisines: string[];
  price_range: number;
  is_active: boolean;
};

export type UserValidationRequest = {
  user_id: number;
};

export type UserValidationResponse = {
  ok: true;
  exists: boolean;
  is_active: boolean;
  email?: string;
};

export type RestaurantSearchRequest = {
  name?: string;
  cuisine?: string;
  city?: string;
  min_price_range?: number;
  max_price_range?: number;
};

export type RestaurantSearchResponse = {
  ok: true;
  items: Restaurant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export type TableValidationRequest = {
  restaurant_id: number;
  table_id: number;
  guests_count: number;
};

export type TableValidationResponse = {
  ok: true;
  exists: boolean;
  is_active: boolean;
  seats_count: number;
};

export type ReviewSummaryRequest = {
  restaurant_id: number;
};

export type ReviewSummaryResponse = {
  ok: true;
  restaurant_id: number;
  average_rating: number;
  reviews_count: number;
};

export type ReservationAvailabilityRequest = {
  user_id: number;
  restaurant_id: number;
  table_id: number;
  reservation_start: string;
  reservation_end: string;
  guests_count: number;
};

export type ReservationAvailabilityResponse = {
  ok: true;
  available: boolean;
  reason: "OK" | "USER_NOT_FOUND" | "USER_INACTIVE" | "TABLE_NOT_FOUND" | "TABLE_INACTIVE" | "CAPACITY_EXCEEDED" | "INVALID_TIME_RANGE";
};