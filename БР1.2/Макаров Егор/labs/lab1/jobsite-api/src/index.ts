import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { AppDataSource } from './data-source';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const app = express();
app.use(cors());
app.use(express.json());

// health-check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Swagger UI
const openapiPath = path.join(__dirname, 'openapi.yaml');
const swaggerDoc = YAML.load(openapiPath);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// API
app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async (): Promise<void> => {
  await AppDataSource.initialize();
  // eslint-disable-next-line no-console
  console.log('Database connected');
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`Swagger UI: http://localhost:${env.port}/api/docs`);
  });
};

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start application:', err);
  process.exit(1);
});

export { app };
