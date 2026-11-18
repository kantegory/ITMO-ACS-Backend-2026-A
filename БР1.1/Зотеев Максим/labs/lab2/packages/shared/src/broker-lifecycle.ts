import type { EventEmitter } from "node:events";

// Kubernetes restarts the worker and re-establishes subscriptions on a fresh channel.
export function restartOnBrokerDisconnect(...streams: EventEmitter[]): void {
  if (process.env.RABBIT_QUORUM !== "true") return;
  for (const stream of streams) {
    stream.once("error", () => {
      console.error("RabbitMQ connection or channel failed");
      process.exit(1);
    });
    stream.once("close", () => process.exit(1));
  }
}
