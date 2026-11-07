import 'reflect-metadata';
import { createApp } from './app';
import { env } from './config/env';
import { initializeDatabase } from './config/data-source';
import { bus } from './messaging/publisher';
import { startProjectionConsumer } from './messaging/consumer';

const bootstrap = async (): Promise<void> => {
  await initializeDatabase();
  console.log(`[${env.service}] БД ${env.db.host}:${env.db.port}/${env.db.database}`);
  await bus.connect();
  await startProjectionConsumer();
  createApp().listen(env.port, () => {
    console.log(`[${env.service}] слушает http://localhost:${env.port}`);
  });
};

bootstrap().catch((error) => {
  console.error(`[${env.service}] не удалось запустить:`, error);
  process.exit(1);
});

const shutdown = async (): Promise<void> => { await bus.close(); process.exit(0); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
