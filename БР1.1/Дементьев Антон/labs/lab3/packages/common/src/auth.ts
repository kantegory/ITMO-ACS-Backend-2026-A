import jwt from 'jsonwebtoken';
import { createPublicKey, KeyObject } from 'crypto';
import { Request, Response, NextFunction } from 'express';

import { fail } from './errors';
import { Role } from './enums';
import { serviceUrl } from './client';

export interface AuthUser { id: string; role: Role }
export interface RequestWithUser extends Request { user?: AuthUser; requestId?: string; serviceClient?: string }

// Кеш публичных ключей Identity (JWKS). Источник: адрес или функция (внутри самого Identity).
export class Jwks {
    private keys = new Map<string, KeyObject>();
    private last = 0;
    private loading?: Promise<void>;
    constructor(private source: string | (() => { keys: any[] })) {}
    private async load() {
        const j = typeof this.source === 'string'
            ? await (await fetch(this.source, { signal: AbortSignal.timeout(2000) })).json()
            : this.source();
        for (const k of j.keys) this.keys.set(k.kid, createPublicKey({ key: k, format: 'jwk' }));
    }
    async getKey(kid: string): Promise<KeyObject> {
        let key = this.keys.get(kid);
        if (key) return key;
        // неизвестный kid: перечитываем ключи (не чаще раза в 3 секунды); одновременные запросы ждут одну загрузку
        if (!this.loading && (!this.keys.size || Date.now() - this.last > 3000)) {
            this.loading = this.load().finally(() => { this.last = Date.now(); this.loading = undefined; });
        }
        if (this.loading) {
            try { await this.loading; } catch (_e) { if (!this.keys.size) throw fail('SERVICE_UNAVAILABLE'); }
        }
        key = this.keys.get(kid);
        if (!key) throw fail('UNAUTHORIZED');
        return key;
    }
}
export const jwksFromIdentity = () => new Jwks(serviceUrl('identity-service') + '/internal/v1/.well-known/jwks.json');

export async function verifyJwt(jwks: Jwks, token: string, options: jwt.VerifyOptions = {}): Promise<any> {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') throw new jwt.JsonWebTokenError('malformed');
    const key = await jwks.getKey((decoded.header as any).kid || '');
    return jwt.verify(token, key, { algorithms: ['RS256'], ...options });
}

const bearer = (req: Request): string | null => {
    const h = req.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) return null;
    return h.slice(7).trim() || null;
};

// Достаёт пользователя из access-токена (typ = user). null — токена нет.
export async function readUser(jwks: Jwks, req: Request): Promise<AuthUser | null> {
    const token = bearer(req);
    if (!token) return null;
    try {
        const p = await verifyJwt(jwks, token);
        if (p.typ !== 'user' || !p.user?.id || !p.user?.role) throw new Error('bad');
        return { id: p.user.id, role: p.user.role };
    } catch (e: any) {
        if (e?.status) throw e;
        if (e?.name === 'TokenExpiredError') throw fail('TOKEN_EXPIRED');
        throw fail('UNAUTHORIZED');
    }
}

export function makeUserAuth(jwks: Jwks) {
    const authMiddleware = (req: RequestWithUser, _res: Response, next: NextFunction) => {
        readUser(jwks, req).then((u) => { if (!u) throw fail('UNAUTHORIZED'); req.user = u; next(); }).catch(next);
    };
    const optionalAuthMiddleware = (req: RequestWithUser, _res: Response, next: NextFunction) => {
        readUser(jwks, req).then((u) => { if (u) req.user = u; next(); }).catch(() => next());
    };
    return { authMiddleware, optionalAuthMiddleware };
}

export const requireRole = (...roles: Role[]) => (req: RequestWithUser, _res: Response, next: NextFunction) => {
    if (!req.user) return next(fail('UNAUTHORIZED'));
    if (!roles.includes(req.user.role)) return next(fail('FORBIDDEN'));
    next();
};

// Защита /internal/v1/**: сервисный токен (typ = service), aud = имя этого сервиса.
export function makeServiceGuard(jwks: Jwks, selfName: string, publicPaths: string[]) {
    return (req: RequestWithUser, _res: Response, next: NextFunction) => {
        if (publicPaths.includes(req.path)) return next();
        const token = bearer(req);
        if (!token) return next(fail('SERVICE_UNAUTHORIZED'));
        verifyJwt(jwks, token, { audience: selfName })
            .then((p) => {
                if (p.typ !== 'service') throw fail('SERVICE_UNAUTHORIZED');
                req.serviceClient = p.sub;
                next();
            })
            .catch((e: any) => {
                if (e?.status) return next(e);
                if (String(e?.message).includes('audience')) return next(fail('SERVICE_FORBIDDEN'));
                next(fail('SERVICE_UNAUTHORIZED'));
            });
    };
}
