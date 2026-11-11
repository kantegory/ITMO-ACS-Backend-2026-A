import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/data-source';
import apiRouter from './routes';
import { errorHandler } from './middleware/error-handler';
import { NotFound } from './utils/errors';

const PORT = parseInt(process.env.PORT || '3000', 10);

const bootstrap = async () => {
  await AppDataSource.initialize();
  console.log('[db] connected');

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1', apiRouter);

  app.use((_req, _res, next) => next(NotFound('Endpoint not found')));
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
    console.log(`[server] API base: http://localhost:${PORT}/api/v1`);
  });
};

bootstrap().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
