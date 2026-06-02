import fs from 'fs';
import path from 'path';
import express, { type Request, type Response } from 'express';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import {
  AUTH_SERVICE_URL,
  RESERVATION_SERVICE_URL,
  RESTAURANT_SERVICE_URL
} from '../../shared/src/config';

const app = express();
const PORT = Number(process.env.PORT) || 3010;

const openApiPath = path.join(__dirname, '../../../docs/openapi.yaml');
let openApiDoc: Record<string, unknown>;
try {
  openApiDoc = yaml.load(fs.readFileSync(openApiPath, 'utf8')) as Record<string, unknown>;
} catch {
  openApiDoc = { openapi: '3.0.3', info: { title: 'Restaurant API Gateway', version: '1.0.0' }, paths: {} };
}

const servers = openApiDoc.servers as Array<Record<string, unknown>> | undefined;
if (servers?.length) {
  const server = servers[0];
  if (!server.variables) server.variables = {};
  const variables = server.variables as Record<string, Record<string, unknown>>;
  if (!variables.port) variables.port = {};
  variables.port.default = String(PORT);
}

app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mode: 'microservices',
    docs: '/api-docs',
    services: { auth: AUTH_SERVICE_URL, restaurant: RESTAURANT_SERVICE_URL, reservation: RESERVATION_SERVICE_URL }
  });
});

app.get('/openapi.yaml', (_req: Request, res: Response) => {
  res.type('text/yaml').sendFile(openApiPath);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDoc, { explorer: true, customSiteTitle: 'Restaurant API Gateway' }));

function pickTarget(req: Request): string {
  if (req.path.startsWith('/auth')) return AUTH_SERVICE_URL;
  if (req.path.startsWith('/users/me/reservations')) return RESERVATION_SERVICE_URL;
  if (req.path.startsWith('/users')) return AUTH_SERVICE_URL;
  if (req.path.startsWith('/reservations')) return RESERVATION_SERVICE_URL;
  if (req.method === 'POST' && /^\/restaurants\/[^/]+\/reservations\/?$/.test(req.path)) {
    return RESERVATION_SERVICE_URL;
  }
  if (req.path.startsWith('/restaurants')) return RESTAURANT_SERVICE_URL;
  return AUTH_SERVICE_URL;
}

async function proxy(req: Request, res: Response) {
  const target = pickTarget(req);
  const url = `${target}${req.originalUrl}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value || key === 'host' || key === 'connection') continue;
    headers.set(key, Array.isArray(value) ? value.join(',') : value);
  }

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    if (chunks.length) init.body = Buffer.concat(chunks);
  }

  try {
    const upstream = await fetch(url, init);
    res.status(upstream.status);
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);
    const body = Buffer.from(await upstream.arrayBuffer());
    return res.send(body);
  } catch (error) {
    console.error('Gateway proxy error:', error);
    return res.status(502).json({ error: 'upstream service unavailable' });
  }
}

app.use((req, res, next) => {
  if (req.path === '/' || req.path.startsWith('/api-docs') || req.path === '/openapi.yaml') {
    return next();
  }
  return proxy(req, res);
});

const server = app.listen(PORT, () => {
  console.log(`API Gateway: http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  console.error(`Gateway failed on port ${PORT}:`, err.message);
  process.exit(1);
});
