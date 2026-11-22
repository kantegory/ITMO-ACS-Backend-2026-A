// Наблюдаемость сервиса (ЛР6/ЛР8): метрики Prometheus и корректное завершение работы.
import type { Server } from 'http';
import type { RequestHandler } from 'express';
import client from 'prom-client';

const SERVICE = process.env.SERVICE_NAME || 'unknown-service';

export const registry = new client.Registry();
registry.setDefaultLabels({ service: SERVICE });
client.collectDefaultMetrics({ register: registry }); // CPU, память, event loop lag, GC процесса Node.js

const labelNames = ['method', 'route', 'status'] as const;
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Длительность обработки HTTP-запроса, секунды',
  labelNames,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});
const httpTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Количество обработанных HTTP-запросов',
  labelNames,
  registers: [registry],
});

/**
 * Замер каждого запроса. В метку route пишется шаблон маршрута (/api/v1/restaurants/:id),
 * а не фактический путь — иначе кардинальность меток растёт с каждым id.
 * Сервис может явно задать метку через res.locals.routeLabel (так делает gateway).
 */
export const metricsMiddleware: RequestHandler = (req, res, next) => {
  if (req.path === '/metrics' || req.path === '/health') return next();
  const stop = httpDuration.startTimer();
  res.on('finish', () => {
    const route: string =
      res.locals.routeLabel ??
      (req.route?.path ? `${req.baseUrl}${req.route.path}` : res.statusCode === 404 ? 'not_found' : 'unmatched');
    const labels = { method: req.method, route, status: String(res.statusCode) };
    stop(labels);
    httpTotal.inc(labels);
  });
  next();
};

export const metricsHandler: RequestHandler = async (_req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
};

/** SIGTERM (остановка контейнера, rolling update в k8s): дождаться активных запросов и выйти. */
export function installGracefulShutdown(server: Server, cleanup?: () => Promise<unknown>): void {
  let stopping = false;
  const stop = (signal: string) => {
    if (stopping) return;
    stopping = true;
    console.log(`[${SERVICE}] ${signal} received, shutting down`);
    setTimeout(() => process.exit(1), 10_000).unref();
    server.close(async () => {
      try { if (cleanup) await cleanup(); } catch (e) { console.warn('[shutdown] cleanup failed:', (e as Error).message); }
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));
}
