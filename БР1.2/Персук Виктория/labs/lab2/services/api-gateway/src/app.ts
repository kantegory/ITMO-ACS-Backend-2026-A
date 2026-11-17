import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { env } from 'process';

const AUTH_SERVICE_URL = env.AUTH_SERVICE_URL || 'http://localhost:3001';
const RESTAURANT_SERVICE_URL = env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';
const RESERVATION_SERVICE_URL = env.RESERVATION_SERVICE_URL || 'http://localhost:3003';
const MENU_SERVICE_URL = env.MENU_SERVICE_URL || 'http://localhost:3004';
const REVIEW_SERVICE_URL = env.REVIEW_SERVICE_URL || 'http://localhost:3005';

const PORT = parseInt(env.APP_PORT || '3000');

const app = express();
app.use(cors());

app.use(createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathFilter: ['/api/v1/auth/**', '/api/v1/users/**'],
}));

app.use(createProxyMiddleware({
    target: RESTAURANT_SERVICE_URL,
    changeOrigin: true,
    pathFilter: ['/api/v1/restaurants/**', '/api/v1/cuisines/**', '/api/v1/photos/**'],
}));

app.use(createProxyMiddleware({
    target: RESERVATION_SERVICE_URL,
    changeOrigin: true,
    pathFilter: ['/api/v1/tables/**', '/api/v1/reservations/**'],
}));

app.use(createProxyMiddleware({
    target: MENU_SERVICE_URL,
    changeOrigin: true,
    pathFilter: ['/api/v1/menus/**', '/api/v1/menu-items/**'],
}));

app.use(createProxyMiddleware({
    target: REVIEW_SERVICE_URL,
    changeOrigin: true,
    pathFilter: ['/api/v1/reviews/**'],
}));

app.get('/health', (_req, res) => res.json({ status: 'ok', version: 'autodeploy' }));

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});

export default app;
