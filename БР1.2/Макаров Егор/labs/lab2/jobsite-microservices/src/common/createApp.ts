import express, { Router } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './http';

/**
 * Стандартное Express-приложение сервиса:
 * health-check, JSON, публичные маршруты и внутренние (/internal) маршруты.
 */
export const createServiceApp = (name: string, routes: Router, internal?: Router): express.Express => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: name }));

  if (internal) app.use('/internal', internal);
  app.use('/', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
