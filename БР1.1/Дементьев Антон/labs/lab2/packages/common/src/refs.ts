import { getClient, UpstreamError } from './client';
import { isApiError } from './client';

// Справочники живут в Reference Service. Ответы кешируются на 10 минут;
// если Reference недоступен, используются устаревшие значения (деградация).
export interface Industry { id: string; title: string; is_published: boolean }
export interface Skill { id: string; name: string }

const TTL = 10 * 60 * 1000;
class Cache<T extends { id: string }> {
    private m = new Map<string, { v: T; t: number }>();
    constructor(private path: string) {}
    async get(ids: string[]): Promise<Map<string, T>> {
        const uniq = Array.from(new Set(ids));
        const now = Date.now();
        const out = new Map<string, T>();
        const need = uniq.filter((id) => { const c = this.m.get(id); if (c && now - c.t < TTL) { out.set(id, c.v); return false; } return true; });
        for (let i = 0; i < need.length; i += 100) {
            const chunk = need.slice(i, i + 100);
            try {
                const r: any = await getClient().call('reference-service', 'POST', this.path, { body: { ids: chunk }, idempotent: true, timeoutMs: 3000 });
                for (const it of r.items) { this.m.set(it.id, { v: it, t: now }); out.set(it.id, it); }
            } catch (e) {
                if (!(e instanceof UpstreamError) && isApiError(e)) {
                    const stale = chunk.filter((id) => this.m.has(id));
                    if (stale.length === chunk.length) { stale.forEach((id) => out.set(id, this.m.get(id)!.v)); continue; }
                }
                throw e;
            }
        }
        return out;
    }
}
export const industries = new Cache<Industry>('/internal/v1/industries/lookup');
export const skills = new Cache<Skill>('/internal/v1/skills/lookup');
