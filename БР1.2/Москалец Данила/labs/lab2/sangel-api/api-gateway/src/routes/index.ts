import { Router } from 'express';
import proxyRoutes from './proxy.routes';

const router = Router();

// Подключаем все прокси-маршруты
router.use('/', proxyRoutes);

export default router;