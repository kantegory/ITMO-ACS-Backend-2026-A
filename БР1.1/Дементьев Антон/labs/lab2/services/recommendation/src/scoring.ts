// Соответствие резюме и вакансии (0–100). Веса: обязательные навыки 40, необязательные 10, стаж 20, отрасль 20, зарплата 10.
// Что нельзя подтвердить данными (например, у вакансии не указана зарплата), очков не даёт.
const W = { required: 40, optional: 10, experience: 20, industry: 20, salary: 10 };

export interface ResumeCtx { industryId: string; salaryFrom: number | null; salaryTo: number | null; skillIds: Set<string>; experienceMonths: number }
export interface VacancyCtx { industryId: string; salaryFrom: number | null; salaryTo: number | null; minExperienceYears: number; required: string[]; optional: string[] }

const overlap = (aF: number | null, aT: number | null, bF: number | null, bT: number | null) =>
    Math.max(aF ?? -Infinity, bF ?? -Infinity) <= Math.min(aT ?? Infinity, bT ?? Infinity);

export const score = (r: ResumeCtx, v: VacancyCtx): number => {
    let points = 0;
    const mReq = v.required.filter((s) => r.skillIds.has(s)).length;
    const mOpt = v.optional.filter((s) => r.skillIds.has(s)).length;
    const hasAny = v.required.length + v.optional.length > 0;
    if (v.required.length > 0) points += W.required * (mReq / v.required.length); else if (hasAny) points += W.required;
    if (v.optional.length > 0) points += W.optional * (mOpt / v.optional.length); else if (hasAny) points += W.optional;
    const need = v.minExperienceYears * 12;
    points += W.experience * (need === 0 ? 1 : Math.min(r.experienceMonths / need, 1));
    if (r.industryId === v.industryId) points += W.industry;
    const rs = r.salaryFrom != null || r.salaryTo != null, vs = v.salaryFrom != null || v.salaryTo != null;
    if (rs && vs && overlap(r.salaryFrom, r.salaryTo, v.salaryFrom, v.salaryTo)) points += W.salary;
    return Math.round(points);
};

export const monthsBetween = (start: string, end: string | null): number => {
    const s = new Date(start), e = end ? new Date(end) : new Date();
    let m = (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + (e.getUTCMonth() - s.getUTCMonth());
    if (e.getUTCDate() < s.getUTCDate()) m -= 1;
    return Math.max(m, 0);
};
