import { ApiError, fail } from './errors';
import { currentRequestId } from './context';

export const SERVICE_NAMES = ['identity-service', 'reference-service', 'vacancy-service', 'resume-service',
    'application-service', 'recommendation-service', 'notification-service'] as const;
export type ServiceName = (typeof SERVICE_NAMES)[number];
const PORTS: Record<ServiceName, number> = { 'identity-service': 8001, 'reference-service': 8002, 'vacancy-service': 8003,
    'resume-service': 8004, 'application-service': 8005, 'recommendation-service': 8006, 'notification-service': 8007 };

// Адрес сервиса: URL_IDENTITY, URL_VACANCY и т.д., по умолчанию имя контейнера из docker compose
export const serviceUrl = (name: ServiceName): string =>
    process.env['URL_' + name.replace('-service', '').toUpperCase()] || `http://${name}:${PORTS[name]}`;

// Ошибка, которую вернул вызванный сервис (4xx): вызывающий решает, что с ней делать
export class UpstreamError extends Error {
    constructor(public status: number, public code: string, message: string, public details?: any) { super(message); }
}

class Breaker {
    private fails: number[] = [];
    private openUntil = 0;
    isOpen() { return Date.now() < this.openUntil; }
    success() { this.fails = []; }
    failure() {
        const now = Date.now();
        this.fails = this.fails.filter((t) => now - t < 10000);
        this.fails.push(now);
        if (this.fails.length >= 5) { this.openUntil = now + 30000; this.fails = []; }
    }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface CallOptions { query?: Record<string, any>; body?: unknown; timeoutMs?: number; retries?: number; idempotent?: boolean }

// Клиент для вызовов между сервисами: сервисный токен, тайм-аут, повторы, circuit breaker
export class ServiceClient {
    private tokens = new Map<string, { token: string; exp: number }>();
    private breakers = new Map<string, Breaker>();
    constructor(private selfName: string, private secret: string) {}

    private async token(aud: ServiceName): Promise<string> {
        const c = this.tokens.get(aud);
        if (c && c.exp > Date.now() + 30000) return c.token;
        let res: Response;
        try {
            res = await fetch(serviceUrl('identity-service') + '/internal/v1/auth/service-token', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: this.selfName, client_secret: this.secret, audience: aud }),
                signal: AbortSignal.timeout(2000),
            });
        } catch (_e) { throw fail('SERVICE_UNAVAILABLE'); }
        if (!res.ok) { console.error(`Не удалось получить сервисный токен (${this.selfName} -> ${aud}): ${res.status}`); throw fail('INTERNAL_ERROR'); }
        const j: any = await res.json();
        this.tokens.set(aud, { token: j.access_token, exp: Date.now() + j.expires_in * 1000 });
        return j.access_token;
    }

    private async once<T>(target: ServiceName, method: string, path: string, o: CallOptions): Promise<T> {
        const url = new URL(serviceUrl(target) + path);
        for (const [k, v] of Object.entries(o.query || {})) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
        const headers: Record<string, string> = { Authorization: `Bearer ${await this.token(target)}`, 'Content-Type': 'application/json' };
        const rid = currentRequestId();
        if (rid) headers['X-Request-Id'] = rid;
        let res: Response;
        try {
            res = await fetch(url, { method, headers, body: o.body !== undefined ? JSON.stringify(o.body) : undefined, signal: AbortSignal.timeout(o.timeoutMs ?? 2000) });
        } catch (e: any) {
            if (e?.name === 'TimeoutError' || e?.name === 'AbortError') throw fail('UPSTREAM_TIMEOUT');
            throw fail('SERVICE_UNAVAILABLE');
        }
        const text = await res.text();
        let data: any;
        try { data = text ? JSON.parse(text) : undefined; } catch (_e) { data = undefined; }
        if (res.ok) return data as T;
        const code = data?.code || 'INTERNAL_ERROR';
        if ((res.status === 401 || res.status === 403) && String(code).startsWith('SERVICE_')) {
            console.error(`Сервисная авторизация отклонена (${this.selfName} -> ${target}): ${code}`);
            throw fail('INTERNAL_ERROR');
        }
        if (res.status === 503) throw fail('SERVICE_UNAVAILABLE');
        if (res.status === 504) throw fail('UPSTREAM_TIMEOUT');
        if (res.status >= 500) throw fail('INTERNAL_ERROR');
        throw new UpstreamError(res.status, code, data?.message || 'Ошибка вызова сервиса', data?.details);
    }

    async call<T = any>(target: ServiceName, method: 'GET' | 'POST', path: string, o: CallOptions = {}): Promise<T> {
        let br = this.breakers.get(target);
        if (!br) { br = new Breaker(); this.breakers.set(target, br); }
        if (br.isOpen()) throw fail('SERVICE_UNAVAILABLE');
        const attempts = 1 + (method === 'GET' || o.idempotent ? o.retries ?? 2 : 0);
        let last: any;
        for (let i = 0; i < attempts; i++) {
            try {
                const r = await this.once<T>(target, method, path, o);
                br.success();
                return r;
            } catch (e: any) {
                if (e instanceof UpstreamError) { br.success(); throw e; }
                br.failure();
                last = e;
                if (i < attempts - 1) await sleep(100 * 2 ** i + Math.random() * 50);
            }
        }
        throw last;
    }
}

let instance: ServiceClient | undefined;
export const getClient = (): ServiceClient => {
    if (!instance) instance = new ServiceClient(process.env.SERVICE_NAME || 'unknown', process.env.SERVICE_SECRET || '');
    return instance;
};
export const isApiError = (e: any): e is ApiError => e instanceof ApiError;
