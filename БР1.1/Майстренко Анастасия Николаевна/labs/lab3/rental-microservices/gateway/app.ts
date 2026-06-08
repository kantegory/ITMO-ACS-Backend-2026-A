import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const PORT = parseInt(process.env.GATEWAY_PORT || '8000');
const PREFIX = '/api/v1';

const IDENTITY_URL = process.env.IDENTITY_URL || 'http://localhost:8001';
const CATALOG_URL = process.env.CATALOG_URL || 'http://localhost:8002';
const BOOKING_URL = process.env.BOOKING_URL || 'http://localhost:8003';
const MESSAGING_URL = process.env.MESSAGING_URL || 'http://localhost:8004';

const app = express();
app.use(cors());

app.get('/health', (_req, res) =>
    res.json({ service: 'api-gateway', status: 'ok', routes: [`${PREFIX}/auth`, `${PREFIX}/users`, `${PREFIX}/properties`, `${PREFIX}/amenities`, `${PREFIX}/bookings`, `${PREFIX}/conversations`] }),
);

// Маршрутизация публичных путей на соответствующие сервисы.
// Префикс /api/v1 срезается; пути /internal наружу не проксируются.
function route(prefix: string, target: string) {
    app.use(
        `${PREFIX}${prefix}`,
        createProxyMiddleware({
            target,
            changeOrigin: true,
            pathRewrite: (path) => `${prefix}${path}`,
        }),
    );
}

route('/auth', IDENTITY_URL);
route('/users', IDENTITY_URL);
route('/properties', CATALOG_URL);
route('/amenities', CATALOG_URL);
route('/bookings', BOOKING_URL);
route('/conversations', MESSAGING_URL);

app.listen(PORT, () => {
    console.log(`[api-gateway] listening on http://localhost:${PORT}`);
    console.log(`[api-gateway] prefix ${PREFIX} -> identity:8001, catalog:8002, booking:8003, messaging:8004`);
});
