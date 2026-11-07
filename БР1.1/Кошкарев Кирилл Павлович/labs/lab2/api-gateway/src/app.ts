import path from 'path';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { env } from './config/env';
import { apiRouter } from './routes';
import { gatewayController } from './controllers';
import { asyncHandler, makeErrorHandler, notFoundHandler } from './middlewares/common';
import { swaggerTheme } from './config/swagger-theme';

const OPENAPI_PATH = path.resolve(__dirname, '..', 'docs', 'openapi.yaml');

export const createApp = (): Application => {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  app.use(express.static(path.resolve(__dirname, '..', 'public')));

  const openapi = YAML.load(OPENAPI_PATH);
  app.get('/openapi.yaml', (_req, res) => res.sendFile(OPENAPI_PATH));
  app.get('/openapi.json', (_req, res) => res.json(openapi));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, {
    customCss: swaggerTheme,
    customSiteTitle: "Lecter's Recipes API (микросервисы)",
    swaggerOptions: { persistAuthorization: true, docExpansion: 'none', filter: true },
  }));

  app.get('/health', asyncHandler(gatewayController.health));
  app.use('/api/v1', apiRouter);
  app.use(notFoundHandler);
  app.use(makeErrorHandler(env.service));
  return app;
};
