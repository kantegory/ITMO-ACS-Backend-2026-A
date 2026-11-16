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

const proxy = (target: string) =>
    createProxyMiddleware({ target, changeOrigin: true });

app.use('/api/v1/auth', proxy(AUTH_SERVICE_URL));
app.use('/api/v1/users', proxy(AUTH_SERVICE_URL));
app.use('/api/v1/cuisines', proxy(RESTAURANT_SERVICE_URL));
app.use('/api/v1/photos', proxy(RESTAURANT_SERVICE_URL));
app.use('/api/v1/restaurants', proxy(RESTAURANT_SERVICE_URL));
app.use('/api/v1/tables', proxy(RESERVATION_SERVICE_URL));
app.use('/api/v1/reservations', proxy(RESERVATION_SERVICE_URL));
app.use('/api/v1/menus', proxy(MENU_SERVICE_URL));
app.use('/api/v1/menu-items', proxy(MENU_SERVICE_URL));
app.use('/api/v1/reviews', proxy(REVIEW_SERVICE_URL));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});

export default app;
