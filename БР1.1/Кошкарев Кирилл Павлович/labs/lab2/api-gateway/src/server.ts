import { createApp } from './app';
import { env } from './config/env';

createApp().listen(env.port, () => {
  console.log(`[${env.service}] слушает http://localhost:${env.port}`);
  console.log(`[${env.service}] витрина  http://localhost:${env.port}/`);
  console.log(`[${env.service}] swagger  http://localhost:${env.port}/docs`);
  console.log(`[${env.service}] сервисы: user=${env.services.user} recipe=${env.services.recipe} social=${env.services.social}`);
});
