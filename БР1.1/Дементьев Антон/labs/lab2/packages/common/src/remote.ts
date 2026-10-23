import { ApiError, fail } from './errors';
import { getClient, UpstreamError } from './client';

// Вызовы соседних сервисов, нужные сразу нескольким (Application, Recommendation)
const call = (svc: any, method: 'GET' | 'POST', path: string, o: any = {}) => getClient().call(svc, method, path, o);

export const getVacancy = async (id: string): Promise<any> => {
    try { return await call('vacancy-service', 'GET', `/internal/v1/vacancies/${id}`); }
    catch (e) { if (e instanceof UpstreamError && e.status === 404) throw fail('VACANCY_NOT_FOUND'); throw e; }
};
export const getResume = async (id: string, view = 'short'): Promise<any> => {
    try { return await call('resume-service', 'GET', `/internal/v1/resumes/${id}`, { query: { view } }); }
    catch (e) { if (e instanceof UpstreamError && e.status === 404) throw fail('RESUME_NOT_FOUND'); throw e; }
};
const lookup = async (svc: string, path: string, ids: string[], extra: any = {}) => {
    const map = new Map<string, any>();
    const uniq = Array.from(new Set(ids));
    for (let i = 0; i < uniq.length; i += 100) {
        const r: any = await call(svc, 'POST', path, { body: { ids: uniq.slice(i, i + 100), ...extra }, idempotent: true, timeoutMs: 3000 });
        for (const it of r.items) map.set(it.id, it);
    }
    return map;
};
export const lookupVacancies = (ids: string[]) => lookup('vacancy-service', '/internal/v1/vacancies/lookup', ids);
export const lookupResumes = (ids: string[], view = 'short') => lookup('resume-service', '/internal/v1/resumes/lookup', ids, { view });
// Пользователи: имена — некритичные данные (при недоступности Identity поля остаются пустыми), контакты — критичные
export const lookupUsers = async (ids: string[], contacts = false): Promise<Map<string, any>> => {
    if (!ids.length) return new Map();
    try { return await lookup('identity-service', '/internal/v1/users/lookup', ids, contacts ? { include_contacts: true } : {}); }
    catch (e) {
        if (!contacts && e instanceof ApiError && (e.status === 503 || e.status === 504)) { console.warn('Identity недоступен: имена в ответе пустые'); return new Map(); }
        throw e;
    }
};

// ---- представления (публичный формат ДЗ 2) из внутренних данных
export const vacancyShort = (v: any) => ({
    id: v.id, title: v.title, company: { id: v.company.id, name: v.company.name, website_url: v.company.website_url ?? null }, industry: v.industry,
    salary_from: v.salary_from, salary_to: v.salary_to, min_experience_years: v.min_experience_years, is_active: v.is_active, created_at: v.created_at,
});
export const resumeShort = (r: any) => ({
    id: r.id, title: r.title, industry: r.industry, salary_exp_from: r.salary_exp_from, salary_exp_to: r.salary_exp_to,
    is_published: r.is_published, total_experience_months: r.total_experience_months, updated_at: r.updated_at,
});
export const applicantShort = (userId: string, u?: any) => ({ user_id: userId, last_name: u?.last_name ?? '', first_name: u?.first_name ?? '', middle_name: u?.middle_name ?? null });
