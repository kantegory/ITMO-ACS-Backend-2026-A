import 'reflect-metadata';
import { createApp } from './app';
import { env } from './config/env';
import { initializeDatabase } from './config/data-source';

const bootstrap = async (): Promise<void> => {
  await initializeDatabase();
  console.log(`[db] подключено к ${env.db.host}:${env.db.port}/${env.db.database}`);

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[http] Lecter's Recipes API слушает http://localhost:${env.port}`);
    console.log(`[http] витрина  http://localhost:${env.port}/`);
    console.log(`[http] swagger  http://localhost:${env.port}/docs`);
    console.log(`[http] API      http://localhost:${env.port}${env.apiPrefix}`);
  });
};

bootstrap().catch((error) => {
  console.error('[fatal] не удалось запустить приложение:', error);
  process.exit(1);
});
