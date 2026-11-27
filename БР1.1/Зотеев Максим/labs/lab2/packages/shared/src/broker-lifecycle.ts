import type { EventEmitter } from "node:events";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// For consumers: a subscription lives on a channel, so after losing the broker the simplest
// reliable recovery is to let Kubernetes (or Docker's restart policy) start a fresh process.
export function restartOnBrokerDisconnect(...streams: EventEmitter[]): void {
  for (const stream of streams) {
    stream.once("error", () => {
      console.error("RabbitMQ connection or channel failed");
      process.exit(1);
    });
    stream.once("close", () => process.exit(1));
  }
}

// For publishers: losing the broker must not take the HTTP API down. `open` returns the
// connection and channel it created; when either closes, the connection is re-established in
// the background with exponential backoff. Until then the caller sees no channel.
export function keepBrokerConnection(open: () => Promise<EventEmitter[]>): void {
  const run = async () => {
    for (let delay = 1000; ; delay = Math.min(delay * 2, 30000)) {
      try {
        const streams = await open();
        console.log("RabbitMQ connected");
        await new Promise<void>((resolve) => {
          for (const stream of streams) {
            stream.on("error", (e: Error) => console.warn("RabbitMQ error:", e.message));
            stream.once("close", () => resolve());
          }
        });
        console.warn("RabbitMQ connection lost, reconnecting");
        delay = 500;
      } catch (e) {
        console.warn("RabbitMQ connect failed:", (e as Error).message);
      }
      await sleep(delay);
    }
  };
  void run();
}
