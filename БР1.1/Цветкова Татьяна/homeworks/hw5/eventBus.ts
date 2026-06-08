import axios from "axios";
import { randomUUID } from "crypto";
import { Request, Response, Router } from "express";
import * as amqp from "amqplib";

/**
 * EventBus — единый интерфейс для асинхронного взаимодействия между микросервисами.
 *
 * Поддерживает два режима, выбираемых через переменные окружения:
 *
 * 1) **RabbitMQ (рекомендуется, ДЗ5)** — при наличии RABBITMQ_URL.
 *    Producer публикует в exchange "events" типа topic с routing key=eventType.
 *    Consumer создаёт durable очередь "<serviceName>.events", биндит её к exchange
 *    по нужным routing keys, читает сообщения с ack и дедупликацией по eventId.
 *
 * 2) **HTTP fan-out (ЛР2, без брокера)** — при пустом RABBITMQ_URL и заданной
 *    EVENT_SUBSCRIBERS. Producer делает HTTP POST по адресам из переменной,
 *    consumer принимает события через Express-роутер bus.router на /internal/events.
 *
 * Публичный интерфейс одинаковый: bus.publish(eventType, payload), bus.on(eventType, handler).
 */

export interface Event<T = unknown> {
  eventId: string;
  eventType: string;
  occurredAt: string;
  payload: T;
}

type Handler = (event: Event) => Promise<void> | void;

export class EventBus {
  readonly mode: "rabbit" | "http";
  private rabbitUrl?: string;
  private httpSubscribers: Array<{ eventType: string; url: string }> = [];

  private readonly handlers = new Map<string, Handler[]>();
  private readonly processedIds = new Set<string>();

  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private readonly exchange = "events";

  constructor(
    rabbitUrl: string | undefined,
    httpSubscribersEnv: string | undefined,
    private readonly serviceName: string,
  ) {
    if (rabbitUrl) {
      this.mode = "rabbit";
      this.rabbitUrl = rabbitUrl;
    } else {
      this.mode = "http";
      if (httpSubscribersEnv) {
        for (const part of httpSubscribersEnv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)) {
          const [eventType, url] = part.split("->").map((s) => s.trim());
          if (eventType && url) this.httpSubscribers.push({ eventType, url });
        }
      }
    }
    console.log(
      `[${serviceName}][event-bus] mode=${this.mode}`,
      this.mode === "rabbit" ? `url=${this.rabbitUrl}` : `subscribers=${this.httpSubscribers.length}`,
    );
  }

  /**
   * Установить соединение с RabbitMQ (с retry-backoff).
   * В HTTP-режиме ничего не делает.
   */
  async connect(): Promise<void> {
    if (this.mode !== "rabbit") return;
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 12; attempt++) {
      try {
        this.connection = await amqp.connect(this.rabbitUrl!);
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.exchange, "topic", { durable: true });
        console.log(`[${this.serviceName}][event-bus] connected to RabbitMQ`);
        return;
      } catch (err) {
        lastErr = err;
        const delay = Math.min(attempt * 1000, 5000);
        console.log(
          `[${this.serviceName}][event-bus] connect retry ${attempt}/12 in ${delay}ms: ${(err as Error).message}`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastErr;
  }

  async publish(eventType: string, payload: unknown): Promise<void> {
    const event: Event = {
      eventId: randomUUID(),
      eventType,
      occurredAt: new Date().toISOString(),
      payload,
    };
    console.log(`[${this.serviceName}][event-bus] -> publish ${eventType}`, payload);

    if (this.mode === "rabbit") {
      if (!this.channel) {
        console.warn(`[${this.serviceName}][event-bus] no channel, event dropped`);
        return;
      }
      this.channel.publish(this.exchange, eventType, Buffer.from(JSON.stringify(event)), {
        persistent: true,
        messageId: event.eventId,
        contentType: "application/json",
      });
      return;
    }

    // http fan-out
    const targets = this.httpSubscribers.filter((s) => s.eventType === eventType);
    await Promise.allSettled(
      targets.map(async (t) => {
        try {
          await axios.post(t.url, event, { timeout: 2000 });
        } catch (err) {
          console.warn(
            `[${this.serviceName}][event-bus] http delivery failed to ${t.url}: ${(err as Error).message}`,
          );
        }
      }),
    );
  }

  on<T = unknown>(eventType: string, handler: (e: Event<T>) => void | Promise<void>): void {
    if (!this.handlers.has(eventType)) this.handlers.set(eventType, []);
    this.handlers.get(eventType)!.push(handler as Handler);
  }

  /**
   * В RabbitMQ-режиме: создаёт очередь "<serviceName>.events", биндит её к exchange
   * по всем зарегистрированным eventType (через bus.on) и запускает consume.
   * Должен вызываться ПОСЛЕ всех bus.on() и ПОСЛЕ bus.connect().
   * В HTTP-режиме ничего не делает (там consume через router).
   */
  async startConsumer(): Promise<void> {
    if (this.mode !== "rabbit") return;
    if (!this.channel) throw new Error("EventBus.startConsumer: not connected");

    const eventTypes = Array.from(this.handlers.keys());
    if (!eventTypes.length) {
      console.log(`[${this.serviceName}][event-bus] no subscriptions, consumer not started`);
      return;
    }

    const queueName = `${this.serviceName}.events`;
    await this.channel.assertQueue(queueName, { durable: true });
    for (const eventType of eventTypes) {
      await this.channel.bindQueue(queueName, this.exchange, eventType);
    }

    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString()) as Event;
        if (this.processedIds.has(event.eventId)) {
          this.channel!.ack(msg);
          return;
        }
        this.processedIds.add(event.eventId);
        console.log(
          `[${this.serviceName}][event-bus] <- received ${event.eventType}`,
          event.payload,
        );
        const handlers = this.handlers.get(event.eventType) ?? [];
        for (const h of handlers) {
          await h(event);
        }
        this.channel!.ack(msg);
      } catch (err) {
        console.error(`[${this.serviceName}][event-bus] consumer error:`, err);
        this.channel!.nack(msg, false, false); // в DLQ или drop
      }
    });

    console.log(
      `[${this.serviceName}][event-bus] consumer queue=${queueName} bound to: ${eventTypes.join(", ")}`,
    );
  }

  /**
   * Express router для приёма событий в HTTP-режиме (обратная совместимость с ЛР2).
   * В RabbitMQ-режиме отдаёт 410 Gone — события идут через брокер.
   */
  get router(): Router {
    const r = Router();
    if (this.mode === "rabbit") {
      r.post("/", (_req, res) =>
        res.status(410).json({ error: "HTTP event bus disabled, RabbitMQ is in use" }),
      );
      return r;
    }
    r.post("/", async (req: Request, res: Response) => {
      const event = req.body as Event;
      if (!event?.eventId || !event?.eventType) {
        return res.status(400).json({ error: "Invalid event" });
      }
      if (this.processedIds.has(event.eventId)) {
        return res.status(200).json({ status: "deduped" });
      }
      this.processedIds.add(event.eventId);
      console.log(
        `[${this.serviceName}][event-bus] <- received ${event.eventType}`,
        event.payload,
      );
      const handlers = this.handlers.get(event.eventType) ?? [];
      for (const h of handlers) {
        try {
          await h(event);
        } catch (err) {
          console.error(`[${this.serviceName}][event-bus] handler error:`, err);
        }
      }
      res.status(200).json({ status: "ok", handled: handlers.length });
    });
    return r;
  }

  async close(): Promise<void> {
    if (this.mode !== "rabbit") return;
    try {
      await this.channel?.close();
    } catch {
      /* noop */
    }
    try {
      await this.connection?.close();
    } catch {
      /* noop */
    }
  }
}
