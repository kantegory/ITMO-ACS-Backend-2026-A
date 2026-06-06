import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { AppError } from './utils/errors';
import applicationRoutes from './routes/application.routes';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/applications', applicationRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ statusCode: err.statusCode, message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ statusCode: 500, message: 'Internal server error' });
});

export default app;
