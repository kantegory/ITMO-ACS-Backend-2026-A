import 'reflect-metadata';
import type { DataSource } from 'typeorm';
import type { Express } from 'express';
import { env } from './common/env';

interface ServiceModule {
  app: Express;
  dataSource: DataSource;
  seed?: () => Promise<void>;
  onReady?: () => Promise<void>;
}

const start = async (): Promise<void> => {
  const name = env.service;

  // Gateway — без БД
  if (name === 'gateway') {
    const { app } = await import('./gateway');
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`[gateway] слушает порт ${env.port}`);
    });
    return;
  }

  // Сервисы со своей БД
  const modules: Record<string, () => Promise<ServiceModule>> = {
    auth: () => import('./services/auth'),
    catalog: () => import('./services/catalog'),
    seeker: () => import('./services/seeker'),
    employer: () => import('./services/employer'),
    vacancy: () => import('./services/vacancy'),
    application: () => import('./services/application'),
    notification: () => import('./services/notification'),
  };

  const loader = modules[name];
  if (!loader) throw new Error(`Неизвестный SERVICE: ${name}`);

  const mod = await loader();
  await mod.dataSource.initialize();
  // eslint-disable-next-line no-console
  console.log(`[${name}] БД подключена (${env.db.name})`);

  if (mod.seed) {
    await mod.seed();
    // eslint-disable-next-line no-console
    console.log(`[${name}] справочники наполнены`);
  }

  if (mod.onReady) {
    await mod.onReady();
  }

  mod.app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[${name}] слушает порт ${env.port}`);
  });
};

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(`[${env.service}] ошибка запуска:`, err);
  process.exit(1);
});
