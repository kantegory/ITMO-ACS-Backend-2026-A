import './../../../packages/common/src/tz';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import spec from '../openapi.json';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { errorHandler, fail, getClient, jwksFromIdentity, notFoundHandler, readUser, requestIdMiddleware, ServiceName, serviceUrl } from '@jobsearch/common';

const PORT = parseInt(process.env.PORT || '8080');
const RATE_MAX = parseInt(process.env.RATE_LIMIT_MAX || '10');
const RATE_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60') * 1000;
const MAIL_DEBUG = process.env.MAIL_DEBUG === 'true';
const jwks = jwksFromIdentity();

// Маршрутизация публичного API по сервисам. Правила проверяются сверху вниз: конкретные выше общих.
const ROUTES: [RegExp, ServiceName][] = [
    [/^\/api\/v1\/vacancies\/[^/]+\/applications/, 'application-service'],
    [/^\/api\/v1\/vacancies\/[^/]+\/recommended-resumes/, 'recommendation-service'],
    [/^\/api\/v1\/resumes\/[^/]+\/recommended-vacancies/, 'recommendation-service'],
    [/^\/api\/v1\/applications(\/|$)/, 'application-service'],
    [/^\/api\/v1\/(auth|users)(\/|$)/, 'identity-service'],
    [/^\/api\/v1\/(industries|skills)(\/|$)/, 'reference-service'],
    [/^\/api\/v1\/(companies|vacancies|favorites)(\/|$)/, 'vacancy-service'],
    [/^\/api\/v1\/resumes(\/|$)/, 'resume-service'],
];

// Лимит запросов на чувствительных эндпоинтах (счётчики в памяти шлюза)
const LIMITED = ['/api/v1/auth/register', '/api/v1/auth/verify-email', '/api/v1/auth/verify-email/resend', '/api/v1/auth/login',
    '/api/v1/auth/password/change-request', '/api/v1/auth/password/change-confirm'];
const hits = new Map<string, number[]>();
const rateLimit = (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'POST' || !LIMITED.includes(req.path)) return next();
    const now = Date.now(), key = `${req.ip}:${req.path}`;
    const recent = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW);
    if (recent.length >= RATE_MAX) {
        res.setHeader('Retry-After', String(Math.max(Math.ceil((recent[0] + RATE_WINDOW - now) / 1000), 1)));
        hits.set(key, recent);
        return next(fail('TOO_MANY_REQUESTS'));
    }
    recent.push(now); hits.set(key, recent); next();
};

// Если клиент передал токен, проверяем подпись и срок уже на входе (кроме страницы вакансии: там токен необязателен)
const precheckJwt = (req: Request, _res: Response, next: NextFunction) => {
    if (!req.headers.authorization || (req.method === 'GET' && /^\/api\/v1\/vacancies\/[^/]+$/.test(req.path))) return next();
    readUser(jwks, req).then(() => next()).catch(next);
};

const proxies = new Map<ServiceName, RequestHandler>();
const proxyFor = (name: ServiceName) => {
    if (!proxies.has(name)) {
        proxies.set(name, createProxyMiddleware({
            target: serviceUrl(name), proxyTimeout: 15000, timeout: 15000,
            on: {
                error: (err: any, req: any, res: any) => {
                    if (res.headersSent) return;
                    const unreachable = ['ECONNREFUSED', 'ENOTFOUND', 'EHOSTUNREACH'].includes(err?.code);
                    const [status, code, message] = unreachable ? [503, 'SERVICE_UNAVAILABLE', 'Сервис временно недоступен'] : [504, 'UPSTREAM_TIMEOUT', 'Превышено время ожидания зависимого сервиса'];
                    if (unreachable) res.setHeader('Retry-After', '5');
                    res.status(status).json({ code, message, request_id: req.requestId });
                },
            },
        }));
    }
    return proxies.get(name)!;
};

const app = express();
app.use(cors());
app.use(requestIdMiddleware);

// Публичный GET /health: собирает состояние сервисов
app.get('/api/v1/health', async (_req, res, next) => {
    const names: ServiceName[] = ['identity-service', 'reference-service', 'vacancy-service', 'resume-service', 'application-service', 'recommendation-service', 'notification-service'];
    const results = await Promise.all(names.map(async (n) => {
        try { const r = await fetch(serviceUrl(n) + '/internal/v1/health', { signal: AbortSignal.timeout(2000) }); return r.ok; } catch (_e) { return false; }
    }));
    const down = names.filter((_n, i) => !results[i]);
    const critical = down.filter((n) => !['recommendation-service', 'notification-service'].includes(n));
    if (critical.length) return next(fail('SERVICE_UNAVAILABLE'));
    res.json({ status: down.length ? 'degraded' : 'ok', version: '1.0.0' });
});

// Тестовый ящик писем (только при MAIL_DEBUG=true): GET /api/v1/dev/mailbox?email=...
if (MAIL_DEBUG) {
    app.get('/api/v1/dev/mailbox', (req, res, next) => {
        getClient().call('notification-service', 'GET', '/internal/v1/dev/mailbox', { query: { email: req.query.email }, timeoutMs: 5000 }).then((r) => res.json(r)).catch(next);
    });
}

// Swagger UI с публичной спецификацией (ДЗ 2): http://localhost:8080/docs
app.get('/docs.json', (_req, res) => res.json(spec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec as any, { swaggerOptions: { persistAuthorization: true } }));

app.use(rateLimit);
app.use(precheckJwt);
app.use((req, res, next) => {
    const route = ROUTES.find(([re]) => re.test(req.path));
    if (!route) return next();
    return proxyFor(route[1])(req, res, next);
});
// /internal/** и всё остальное: 404
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => console.log(`[api-gateway] запущен на порту ${PORT}`));
