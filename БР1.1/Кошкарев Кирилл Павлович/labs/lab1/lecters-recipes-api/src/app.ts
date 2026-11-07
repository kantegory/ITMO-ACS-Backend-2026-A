import path from 'path';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { swaggerTheme } from './config/swagger-theme';

const OPENAPI_PATH = path.resolve(__dirname, '..', 'docs', 'openapi.yaml');

export const createApp = (): Application => {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  // Витрина «Lecter's Recipes» — статический клиент поверх API
  app.use(express.static(path.resolve(__dirname, '..', 'public')));

  // Спецификация OpenAPI (ДЗ2) и Swagger UI
  const openapi = YAML.load(OPENAPI_PATH);
  app.get('/openapi.yaml', (_req, res) => res.sendFile(OPENAPI_PATH));
  app.get('/openapi.json', (_req, res) => res.json(openapi));
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openapi, {
      customCss: swaggerTheme,
      customSiteTitle: "Lecter's Recipes API",
      swaggerOptions: { persistAuthorization: true, docExpansion: 'none', filter: true },
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'lecters-recipes-api', uptime: process.uptime() });
  });

  app.use(env.apiPrefix, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
