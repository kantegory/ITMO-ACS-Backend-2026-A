import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'user-service', 
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', userRoutes);

// Внутренние эндпоинты для других сервисов
app.post('/internal/validate', async (req, res) => {
  try {
    const { AuthService } = require('./modules/auth/auth.service');
    const authService = new AuthService();
    const result = await authService.validateToken(req.body.token);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ error: { code: 401, message: error.message } });
  }
});

app.get('/internal/users/:id', async (req, res) => {
  try {
    const { AuthService } = require('./modules/auth/auth.service');
    const authService = new AuthService();
    const id = parseInt(req.params.id);
    const user = await authService.getUserById(id);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(404).json({ error: { code: 404, message: error.message } });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);