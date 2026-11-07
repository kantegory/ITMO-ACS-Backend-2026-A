import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { apiRouter, internalRouter } from './routes';
import { makeErrorHandler, notFoundHandler } from './middlewares/common';
import { bus } from './messaging/publisher';

export const createApp = (): Application => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok', service: env.service, uptime: process.uptime(),
      broker: bus.isConnected ? 'connected' : 'disconnected',
    });
  });

  app.use('/api/v1', apiRouter);
  app.use('/internal', internalRouter);
  app.use(notFoundHandler);
  app.use(makeErrorHandler(env.service));
  return app;
};
