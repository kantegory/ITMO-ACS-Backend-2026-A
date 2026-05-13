import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const PORT = Number(process.env.PORT || 3000);
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:8081';
const CATALOG_URL = process.env.CATALOG_URL || 'http://localhost:8082';
const RESERVATION_URL = process.env.RESERVATION_URL || 'http://localhost:8083';
const REVIEW_URL = process.env.REVIEW_URL || 'http://localhost:8084';

// тело запроса проксируется как поток — bodyParser в gateway намеренно не подключаем
const mk = (target: string) => createProxyMiddleware({ target, changeOrigin: true });

const proxies = {
  auth: mk(AUTH_URL),
  catalog: mk(CATALOG_URL),
  reservation: mk(RESERVATION_URL),
  review: mk(REVIEW_URL),
};
type Key = keyof typeof proxies;

function pick(path: string): Key | undefined {
  if (path.startsWith('/api/v1/auth')) return 'auth';
  if (path.startsWith('/api/v1/users/me/reservations')) return 'reservation';
  if (path.startsWith('/api/v1/users')) return 'auth';
  if (/^\/api\/v1\/restaurants\/\d+\/reviews(\/|$)/.test(path)) return 'review';
  if (path.startsWith('/api/v1/restaurants') || path.startsWith('/api/v1/cuisines')) return 'catalog';
  if (path.startsWith('/api/v1/reservations')) return 'reservation';
  if (path.startsWith('/api/v1/reviews')) return 'review';
  return undefined;
}

const app = express();
app.use(cors());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }));
app.get('/', (_req, res) => res.json({
  service: 'api-gateway',
  routes: {
    'POST /api/v1/auth/register|login': AUTH_URL,
    'GET|PUT /api/v1/users/me': AUTH_URL,
    'GET /api/v1/users/me/reservations': RESERVATION_URL,
    'GET /api/v1/restaurants*, /api/v1/cuisines': CATALOG_URL,
    'GET /api/v1/restaurants/:id/reviews': REVIEW_URL,
    '* /api/v1/reservations*': RESERVATION_URL,
    '* /api/v1/reviews*': REVIEW_URL,
  },
}));

app.use((req, res, next) => {
  if (!req.path.startsWith('/api/v1')) return next();
  const key = pick(req.path);
  if (!key) return res.status(404).json({ error: 'Not Found', message: `No route for ${req.method} ${req.path}` });
  return proxies[key](req, res, next);
});

app.use((_req, res) => res.status(404).json({ error: 'Not Found', message: 'Unknown endpoint' }));

app.listen(PORT, () => {
  console.log(`[api-gateway] listening on :${PORT}`);
  console.log(`  auth        -> ${AUTH_URL}`);
  console.log(`  catalog     -> ${CATALOG_URL}`);
  console.log(`  reservation -> ${RESERVATION_URL}`);
  console.log(`  review      -> ${REVIEW_URL}`);
});
