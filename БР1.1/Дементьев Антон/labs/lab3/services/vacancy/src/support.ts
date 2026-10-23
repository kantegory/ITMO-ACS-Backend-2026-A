import { EntityManager, In } from 'typeorm';
import { fail, invalid, publishEvent, refs, uuidParam } from '@jobsearch/common';

import { dataSource } from './db';
import { Company } from './models/company.entity';
import { Vacancy } from './models/vacancy.entity';
import { VacancySkill } from './models/vacancy-skill.entity';

// ---------- проверки и доступ ----------
export const loadOwnedCompany = async (id: string, userId: string) => {
    const c = await dataSource.getRepository(Company).findOneBy({ id: uuidParam(id, 'COMPANY_NOT_FOUND') });
    if (!c) throw fail('COMPANY_NOT_FOUND');
    if (c.ownerUserId !== userId) throw fail('FORBIDDEN');
    return c;
};
export const loadOwnedVacancy = async (id: string, userId: string) => {
    const v = await dataSource.getRepository(Vacancy).findOne({ where: { id: uuidParam(id, 'VACANCY_NOT_FOUND') }, relations: { company: true } });
    if (!v) throw fail('VACANCY_NOT_FOUND');
    if (v.company.ownerUserId !== userId) throw fail('FORBIDDEN');
    return v;
};
export const requireIndustry = async (id: string) => {
    const i = (await refs.industries.get([id])).get(id);
    if (!i || !i.is_published) throw invalid('industry_id', 'Отрасль не найдена');
};
export const requireSkills = async (ids: string[], field: string) => {
    const uniq = Array.from(new Set(ids));
    if (!uniq.length) return;
    const found = await refs.skills.get(uniq);
    if (found.size !== uniq.length) throw invalid(field, 'Часть навыков не найдена в справочнике');
};
export const checkSalaryRange = (from: number | null | undefined, to: number | null | undefined, field: string) => {
    if (from != null && to != null && from > to) throw invalid(field, 'Нижняя граница не может быть больше верхней');
};

// ---------- представления ----------
const industryRef = (m: Map<string, any>, id: string) => ({ id, title: m.get(id)?.title ?? '' });
export const companyShortView = (c: Company) => ({ id: c.id, name: c.name, website_url: c.websiteUrl ?? null });
export const companyView = (c: Company, ind: Map<string, any>) => ({
    id: c.id, name: c.name, industry: industryRef(ind, c.industryId), description: c.description ?? null,
    website_url: c.websiteUrl ?? null, created_at: c.createdAt, updated_at: c.updatedAt,
});
export const vacancyShortView = (v: Vacancy, ind: Map<string, any>) => ({
    id: v.id, title: v.title, company: companyShortView(v.company), industry: industryRef(ind, v.industryId),
    salary_from: v.salaryFrom, salary_to: v.salaryTo, min_experience_years: v.minExperienceYears, is_active: v.isActive, created_at: v.createdAt,
});
// Названия отраслей для набора вакансий (или компаний): один пакетный запрос к Reference (с кешем)
export const industriesFor = (vs: Vacancy[], cs: Company[] = []) =>
    refs.industries.get([...vs.map((v) => v.industryId), ...vs.map((v) => v.company?.industryId), ...cs.map((c) => c.industryId)].filter(Boolean) as string[]);

export const loadSkills = async (vacancyIds: string[]) => {
    const map = new Map<string, VacancySkill[]>();
    if (!vacancyIds.length) return map;
    const rows = await dataSource.getRepository(VacancySkill).find({ where: { vacancyId: In(vacancyIds) } });
    for (const r of rows) { if (!map.has(r.vacancyId)) map.set(r.vacancyId, []); map.get(r.vacancyId)!.push(r); }
    return map;
};
const skillViews = (rows: VacancySkill[], names: Map<string, any>) =>
    rows.map((r) => ({ skill: { id: r.skillId, name: names.get(r.skillId)?.name ?? '' }, is_required: r.isRequired })).sort((a, b) => a.skill.name.localeCompare(b.skill.name));

// Полные данные вакансий (публичная карточка и внутреннее представление)
export const buildVacancies = async (vs: Vacancy[]) => {
    const ind = await industriesFor(vs);
    const skillMap = await loadSkills(vs.map((v) => v.id));
    const names = await refs.skills.get(Array.from(skillMap.values()).flat().map((s) => s.skillId));
    return vs.map((v) => ({
        id: v.id, title: v.title, description: v.description, requirements: v.requirements ?? null,
        company: companyView(v.company, ind), industry: industryRef(ind, v.industryId),
        salary_from: v.salaryFrom, salary_to: v.salaryTo, min_experience_years: v.minExperienceYears,
        skills: skillViews(skillMap.get(v.id) || [], names), is_active: v.isActive, created_at: v.createdAt, updated_at: v.updatedAt,
    }));
};
// Внутреннее представление (openapi-internal.yaml: InternalVacancy)
export const internalVacancies = async (vs: Vacancy[]) =>
    (await buildVacancies(vs)).map((d, i) => ({
        id: d.id, title: d.title,
        company: { id: vs[i].company.id, name: vs[i].company.name, website_url: vs[i].company.websiteUrl ?? null, owner_user_id: vs[i].company.ownerUserId },
        industry: d.industry, salary_from: d.salary_from, salary_to: d.salary_to, min_experience_years: d.min_experience_years,
        is_active: d.is_active, skills: d.skills, created_at: d.created_at, updated_at: d.updated_at,
    }));

// ---------- события ----------
export const emitVacancyUpsert = async (m: EntityManager, vacancyId: string) => {
    const v = await m.findOneByOrFail(Vacancy, { id: vacancyId });
    const sk = await m.find(VacancySkill, { where: { vacancyId } });
    await publishEvent(m, 'vacancy.upserted', {
        vacancy_id: v.id, industry_id: v.industryId, salary_from: v.salaryFrom, salary_to: v.salaryTo, min_experience_years: v.minExperienceYears,
        is_active: v.isActive, skills: sk.map((s) => ({ skill_id: s.skillId, is_required: s.isRequired })),
        created_at: v.createdAt.toISOString(), updated_at: v.updatedAt.toISOString(),
    });
};
