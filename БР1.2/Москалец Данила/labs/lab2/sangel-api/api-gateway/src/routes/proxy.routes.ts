import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { settings } from '../config/settings';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// Применяем rate limit ко всем запросам
router.use(rateLimiter);

// Публичные маршруты (без аутентификации)
router.use('/api/v1/auth', createProxyMiddleware({
  target: settings.services.user,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/auth': '/api/v1/auth' },
}));

// Защищенные маршруты (с аутентификацией)
router.use(authMiddleware);

// User Service
router.use('/api/v1/users', createProxyMiddleware({
  target: settings.services.user,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/users': '/api/v1' },
}));

router.use('/api/v1/profile', createProxyMiddleware({
  target: settings.services.user,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/profile': '/api/v1/profile' },
}));

// Company Service
router.use('/api/v1/companies', createProxyMiddleware({
  target: settings.services.company,
  changeOrigin: true,
}));

router.use('/api/v1/services', createProxyMiddleware({
  target: settings.services.company,
  changeOrigin: true,
}));

router.use('/api/v1/categories', createProxyMiddleware({
  target: settings.services.company,
  changeOrigin: true,
}));

// Order Service
router.use('/api/v1/requests', createProxyMiddleware({
  target: settings.services.order,
  changeOrigin: true,
}));

router.use('/api/v1/reviews', createProxyMiddleware({
  target: settings.services.order,
  changeOrigin: true,
}));

router.use('/api/v1/favorites', createProxyMiddleware({
  target: settings.services.order,
  changeOrigin: true,
}));

router.use('/api/v1/me', createProxyMiddleware({
  target: settings.services.order,
  changeOrigin: true,
}));

// Analytics Service (только ADMIN)
router.use('/api/v1/admin', createProxyMiddleware({
  target: settings.services.analytics,
  changeOrigin: true,
}));

export default router;