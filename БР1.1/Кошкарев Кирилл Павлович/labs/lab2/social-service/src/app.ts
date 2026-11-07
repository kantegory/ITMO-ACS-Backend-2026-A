import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { apiRouter, internalRouter } from './routes';
import { asyncHandler, makeErrorHandler, notFoundHandler } from './middlewares/common';
import { bus } from './messaging/publisher';
import { socialService } from './services/social.service';

export const createApp = (): Application => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  app.get('/health', asyncHandler(async (_req, res) => {
    res.json({
      status: 'ok',
      service: env.service,
      uptime: process.uptime(),
      broker: bus.isConnected ? 'connected' : 'disconnected',
      projections: await socialService.projectionStats(),
    });
  }));
  // тот же ответ под внутренним префиксом — так его опрашивает gateway
  app.get('/internal/social/health', asyncHandler(async (_req, res) => {
    res.json({
      status: 'ok',
      broker: bus.isConnected ? 'connected' : 'disconnected',
      projections: await socialService.projectionStats(),
    });
  }));

  app.use('/api/v1', apiRouter);
  app.use('/internal', internalRouter);
  app.use(notFoundHandler);
  app.use(makeErrorHandler(env.service));
  return app;
};
