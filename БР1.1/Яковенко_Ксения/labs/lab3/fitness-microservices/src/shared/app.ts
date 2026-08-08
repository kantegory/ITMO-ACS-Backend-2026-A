import cors from 'cors';
import express, { Express } from 'express';
import { errorHandler, notFoundHandler } from './http';

export function createServiceApp(serviceName: string): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.get('/health', (_req, res) => {
    res.json({ service: serviceName, status: 'ok', timestamp: new Date().toISOString() });
  });
  return app;
}

export function finishServiceApp(app: Express): void {
  app.use(notFoundHandler);
  app.use(errorHandler);
}
