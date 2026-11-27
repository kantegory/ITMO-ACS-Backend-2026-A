import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';  // ← импортируем из index.ts
import { loggerMiddleware } from './middleware/logger.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'api-gateway', 
    timestamp: new Date().toISOString(),
    services: {
      user: process.env.USER_SERVICE_URL,
      company: process.env.COMPANY_SERVICE_URL,
      order: process.env.ORDER_SERVICE_URL,
      analytics: process.env.ANALYTICS_SERVICE_URL,
    }
  });
});

// Подключаем все маршруты
app.use('/', routes);  // ← используем routes из index.ts

app.use(notFoundHandler);
app.use(errorHandler);