import amqp, { ChannelModel, ConfirmChannel, Options } from "amqplib";
import { setTimeout as delay } from "node:timers/promises";
import { networkMode, required } from "../shared/config";
import { eventTypes } from "./events";

export const messagingEnabled = () => process.env.MESSAGING_ENABLED === "true";
export const topology = () => {
  const namespace = process.env.RABBITMQ_NAMESPACE ?? "itmo.booking";
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(namespace)) throw new Error("Invalid RABBITMQ_NAMESPACE");
  return { exchange: `${namespace}.events`, queue: `${namespace}.notifications`, deadExchange: `${namespace}.dead`, deadQueue: `${namespace}.notifications.dead` };
};

export const declareTopology = async (channel: ConfirmChannel) => {
  const names = topology();
  await channel.assertExchange(names.exchange, "topic", { durable: true });
  await channel.assertExchange(names.deadExchange, "fanout", { durable: true });
  await channel.assertQueue(names.queue, { durable: true, arguments: { "x-queue-type": "quorum" } });
  await channel.assertQueue(names.deadQueue, { durable: true, arguments: { "x-queue-type": "quorum" } });
  for (const type of eventTypes) await channel.bindQueue(names.queue, names.exchange, type);
  await channel.bindQueue(names.deadQueue, names.deadExchange, "");
};

export const confirmPublish = (channel: ConfirmChannel, exchange: string, key: string, body: Buffer, options: Options.Publish = {}) =>
  new Promise<void>((resolve, reject) => {
    const returned = () => finish(new Error("Message was not routed"));
    const timer = setTimeout(() => finish(new Error("Publisher confirm timeout")), 3000);
    const finish = (error?: Error | null) => {
      clearTimeout(timer);
      channel.off("return", returned);
      if (error) reject(error); else resolve();
    };
    // One outstanding publication per channel makes a returned message unambiguous.
    channel.once("return", returned);
    try { channel.publish(exchange, key, body, { ...options, persistent: true, mandatory: true, contentType: "application/json" }, finish); }
    catch (error) { finish(error instanceof Error ? error : new Error("Publish failed")); }
  });

export const pause = (ms: number, signal: AbortSignal) => delay(ms, undefined, { signal }).catch(() => {});

export const rabbitAddress = () => {
  const address = new URL(required("RABBITMQ_URL"));
  const host = networkMode() === "compose" ? "rabbitmq" : "127.0.0.1";
  if (address.protocol !== "amqp:" || address.hostname !== host) throw new Error(`RabbitMQ must use amqp://${host}`);
  return address;
};

export const rabbitWorker = (session: (channel: ConfirmChannel, signal: AbortSignal) => Promise<void>) => {
  const address = rabbitAddress();
  const shutdown = new AbortController();
  let connection: ChannelModel | undefined;
  let connected = false;
  const finished = (async () => {
    while (!shutdown.signal.aborted) {
      const disconnected = new AbortController();
      const abort = () => disconnected.abort();
      shutdown.signal.addEventListener("abort", abort, { once: true });
      try {
        connection = await amqp.connect(address.toString(), { timeout: 2000 });
        connection.on("error", () => {});
        connection.once("close", abort);
        const channel = await connection.createConfirmChannel();
        channel.on("error", abort);
        channel.once("close", abort);
        await declareTopology(channel);
        connected = !disconnected.signal.aborted;
        await session(channel, disconnected.signal);
      } catch {
        // Do not log connection URLs: they contain broker credentials.
      } finally {
        connected = false;
        disconnected.abort();
        shutdown.signal.removeEventListener("abort", abort);
        await connection?.close().catch(() => {});
        connection = undefined;
      }
      await pause(500, shutdown.signal);
    }
  })();
  return { isConnected: () => connected,
    stop: async () => { shutdown.abort(); await connection?.close().catch(() => {}); await finished; } };
};
