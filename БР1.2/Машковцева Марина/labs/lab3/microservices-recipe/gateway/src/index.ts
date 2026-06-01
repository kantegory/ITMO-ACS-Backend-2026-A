import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Настройки сервисов (из переменных окружения или localhost по умолчанию)
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL || 'http://localhost:3002';
const SOCIAL_SERVICE_URL = process.env.SOCIAL_SERVICE_URL || 'http://localhost:3003';

// Логирование всех запросов
app.use((req, res, next) => {
    console.log(`[Gateway] ${req.method} ${req.url}`);
    next();
});

// Прокси для User Service
app.use('/api/auth', createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('[Gateway] User Service error:', err.message);
        res.status(503).json({ message: 'User Service unavailable' });
    }
}));

app.use('/api/users', createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('[Gateway] User Service error:', err.message);
        res.status(503).json({ message: 'User Service unavailable' });
    }
}));

// Прокси для Recipe Service
app.use('/api/recipes', createProxyMiddleware({
    target: RECIPE_SERVICE_URL,
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('[Gateway] Recipe Service error:', err.message);
        res.status(503).json({ message: 'Recipe Service unavailable' });
    }
}));

// Прокси для Social Service
app.use('/api/comments', createProxyMiddleware({
    target: SOCIAL_SERVICE_URL,
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('[Gateway] Social Service error:', err.message);
        res.status(503).json({ message: 'Social Service unavailable' });
    }
}));

app.use('/api/likes', createProxyMiddleware({
    target: SOCIAL_SERVICE_URL,
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('[Gateway] Social Service error:', err.message);
        res.status(503).json({ message: 'Social Service unavailable' });
    }
}));

app.use('/api/saved', createProxyMiddleware({
    target: SOCIAL_SERVICE_URL,
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('[Gateway] Social Service error:', err.message);
        res.status(503).json({ message: 'Social Service unavailable' });
    }
}));

app.use('/api/subscriptions', createProxyMiddleware({
    target: SOCIAL_SERVICE_URL,
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('[Gateway] Social Service error:', err.message);
        res.status(503).json({ message: 'Social Service unavailable' });
    }
}));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gateway' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`   Routes:`);
    console.log(`   /api/auth/*      → ${USER_SERVICE_URL}`);
    console.log(`   /api/users/*     → ${USER_SERVICE_URL}`);
    console.log(`   /api/recipes/*   → ${RECIPE_SERVICE_URL}`);
    console.log(`   /api/comments/*  → ${SOCIAL_SERVICE_URL}`);
    console.log(`   /api/likes/*     → ${SOCIAL_SERVICE_URL}`);
    console.log(`   /api/saved/*     → ${SOCIAL_SERVICE_URL}`);
    console.log(`   /api/subscriptions/* → ${SOCIAL_SERVICE_URL}`);
    console.log(`   /health          → health check`);
});