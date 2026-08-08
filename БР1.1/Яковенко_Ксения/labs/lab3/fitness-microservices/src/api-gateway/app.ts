import 'reflect-metadata';
import { Request } from 'express';
import { createServiceApp, finishServiceApp } from '../shared/app';
import { envInt, envString, GATEWAY_TOKEN, SERVICE_TOKEN } from '../shared/env';
import { asyncHandler, HttpError } from '../shared/http';

const app = createServiceApp('api-gateway');
const port = envInt('GATEWAY_PORT', 3000);

const services = {
  identity: envString('IDENTITY_SERVICE_URL', 'http://localhost:3001'),
  catalog: envString('CATALOG_SERVICE_URL', 'http://localhost:3002'),
  plans: envString('PLANS_SERVICE_URL', 'http://localhost:3003'),
  progress: envString('PROGRESS_SERVICE_URL', 'http://localhost:3004'),
  content: envString('CONTENT_SERVICE_URL', 'http://localhost:3005'),
  media: envString('MEDIA_SERVICE_URL', 'http://localhost:3006'),
  notifications: envString('NOTIFICATION_SERVICE_URL', 'http://localhost:3007'),
};

type ServiceName = keyof typeof services;

function targetFor(path: string): ServiceName | undefined {
  if (
    path.startsWith('/api/users/me/body-metrics') ||
    path.startsWith('/api/users/me/workout-sessions')
  ) {
    return 'progress';
  }
  if (path.startsWith('/api/users/me/training-plans')) return 'plans';
  if (
    path.startsWith('/api/users/me/notifications') ||
    path.startsWith('/api/users/me/notification-settings')
  ) {
    return 'notifications';
  }
  if (
    path === '/api/users/me' ||
    path.startsWith('/api/users/me/profile') ||
    path.startsWith('/api/auth')
  ) {
    return 'identity';
  }
  if (path.startsWith('/api/workouts') || path.startsWith('/api/metadata')) return 'catalog';
  if (path.startsWith('/api/training-plans')) return 'plans';
  if (path.startsWith('/api/blog')) return 'content';
  if (
    path.startsWith('/api/uploads') ||
    path.startsWith('/api/media') ||
    path.startsWith('/uploads')
  ) {
    return 'media';
  }
  return undefined;
}

function isPublic(req: Request): boolean {
  const path = req.path;
  if (path.startsWith('/uploads/')) return true;
  if (
    req.method === 'POST' &&
    ['/api/auth/register', '/api/auth/login', '/api/auth/refresh'].includes(path)
  ) {
    return true;
  }
  if (req.method === 'GET') {
    return (
      path.startsWith('/api/workouts') ||
      path.startsWith('/api/metadata') ||
      path.startsWith('/api/training-plans') ||
      path.startsWith('/api/blog/posts') ||
      path === '/api/blog/categories'
    );
  }
  return false;
}

async function verifyUser(
  authorization: string | undefined,
): Promise<{ userId: number; role: string }> {
  if (!authorization) throw new HttpError(401, 'Authorization header is required', 'UNAUTHORIZED');
  let response: Response;
  try {
    response = await fetch(`${services.identity}/api/internal/tokens/verify`, {
      method: 'POST',
      headers: {
        authorization,
        'content-type': 'application/json',
        'x-service-token': SERVICE_TOKEN,
      },
      body: '{}',
    });
  } catch (error) {
    throw new HttpError(
      503,
      error instanceof Error ? error.message : 'Identity Service is unavailable',
      'IDENTITY_SERVICE_UNAVAILABLE',
    );
  }

  const payload = (await response.json()) as {
    userId?: number;
    role?: string;
    message?: string;
    error?: string;
  };
  if (!response.ok || !payload.userId || !payload.role) {
    throw new HttpError(
      response.status,
      payload.message ?? 'Token verification failed',
      payload.error ?? 'UNAUTHORIZED',
    );
  }
  return { userId: payload.userId, role: payload.role };
}

function forwardedHeaders(
  req: Request,
  user?: { userId: number; role: string },
): Record<string, string> {
  const headers: Record<string, string> = {
    'x-gateway-token': GATEWAY_TOKEN,
    'x-correlation-id': req.header('x-correlation-id') ?? crypto.randomUUID(),
  };
  const authorization = req.header('authorization');
  if (authorization) headers.authorization = authorization;
  const contentType = req.header('content-type');
  if (contentType) headers['content-type'] = contentType;
  if (user) {
    headers['x-user-id'] = String(user.userId);
    headers['x-user-role'] = user.role;
  }
  return headers;
}

app.get(
  '/health/services',
  asyncHandler(async (_req, res) => {
    const checks = await Promise.all(
      Object.entries(services).map(async ([name, baseUrl]) => {
        try {
          const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(2000) });
          return [name, response.ok ? 'ok' : `http-${response.status}`] as const;
        } catch {
          return [name, 'unavailable'] as const;
        }
      }),
    );
    res.json(Object.fromEntries(checks));
  }),
);

app.use(
  asyncHandler(async (req, res) => {
    const targetName = targetFor(req.path);
    if (!targetName) throw new HttpError(404, 'API route was not found', 'ROUTE_NOT_FOUND');
    const user = isPublic(req) ? undefined : await verifyUser(req.header('authorization'));
    const targetUrl = `${services[targetName]}${req.originalUrl}`;

    let response: Response;
    try {
      const hasBody = !['GET', 'HEAD'].includes(req.method) && req.body !== undefined;
      response = await fetch(targetUrl, {
        method: req.method,
        headers: forwardedHeaders(req, user),
        body: hasBody ? JSON.stringify(req.body) : undefined,
        redirect: 'manual',
      });
    } catch (error) {
      throw new HttpError(
        503,
        error instanceof Error ? error.message : `${targetName} service is unavailable`,
        'SERVICE_UNAVAILABLE',
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) res.setHeader('content-disposition', contentDisposition);
    res.status(response.status);
    const body = Buffer.from(await response.arrayBuffer());
    res.send(body);
  }),
);

finishServiceApp(app);

app.listen(port, '0.0.0.0', () => {
  console.log(`api-gateway is running on http://localhost:${port}`);
});
