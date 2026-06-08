/**
 * Клиент для синхронных межсервисных вызовов (REST /internal).
 * Добавляет служебный заголовок X-Internal-Token и обрабатывает ошибки.
 */
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || 'internal-secret';

export async function internalGet<T = any>(url: string): Promise<T | null> {
    try {
        const res = await fetch(url, {
            headers: { 'X-Internal-Token': INTERNAL_TOKEN },
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Upstream ${url} -> ${res.status}`);
        return (await res.json()) as T;
    } catch (e) {
        console.error('internalGet error:', (e as Error).message);
        throw e;
    }
}

export async function internalPatch<T = any>(url: string, body: any): Promise<T | null> {
    const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Token': INTERNAL_TOKEN },
        body: JSON.stringify(body),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Upstream ${url} -> ${res.status}`);
    return (await res.json()) as T;
}

export function internalGuard(req: any, res: any, next: any) {
    if (req.headers['x-internal-token'] !== INTERNAL_TOKEN) {
        return res.status(401).send({ code: 'UNAUTHORIZED', message: 'Недействительный служебный токен' });
    }
    next();
}
