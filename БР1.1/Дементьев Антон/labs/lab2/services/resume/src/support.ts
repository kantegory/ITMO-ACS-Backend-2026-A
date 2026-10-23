import { EntityManager, In } from 'typeorm';
import { fail, invalid, publishEvent, refs, uuidParam } from '@jobsearch/common';

import { dataSource } from './db';
import { Resume } from './models/resume.entity';
import { ResumeEducation } from './models/resume-education.entity';
import { ResumeExperience } from './models/resume-experience.entity';
import { ResumeSkill } from './models/resume-skill.entity';

export const loadOwnedResume = async (id: string, userId: string) => {
    const r = await dataSource.getRepository(Resume).findOneBy({ id: uuidParam(id, 'RESUME_NOT_FOUND') });
    if (!r) throw fail('RESUME_NOT_FOUND');
    if (r.userId !== userId) throw fail('FORBIDDEN');
    return r;
};
export const requireIndustry = async (id: string) => {
    const i = (await refs.industries.get([id])).get(id);
    if (!i || !i.is_published) throw invalid('industry_id', 'Отрасль не найдена');
};
export const requireSkills = async (ids: string[], field: string) => {
    const uniq = Array.from(new Set(ids));
    if (!uniq.length) return [];
    const found = await refs.skills.get(uniq);
    if (found.size !== uniq.length) throw invalid(field, 'Часть навыков не найдена в справочнике');
    return uniq.map((id) => found.get(id)!);
};
export const checkSalaryRange = (from: number | null | undefined, to: number | null | undefined, field: string) => {
    if (from != null && to != null && from > to) throw invalid(field, 'Нижняя граница не может быть больше верхней');
};

// ---------- стаж ----------
export const monthsBetween = (start: string, end: string | null): number => {
    const s = new Date(start), e = end ? new Date(end) : new Date();
    let m = (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + (e.getUTCMonth() - s.getUTCMonth());
    if (e.getUTCDate() < s.getUTCDate()) m -= 1;
    return Math.max(m, 0);
};
export const totalExperienceMonths = (exps: ResumeExperience[]) => exps.reduce((sum, e) => sum + monthsBetween(e.startDate, e.endDate), 0);

// ---------- представления ----------
export const experienceView = (e: ResumeExperience) => ({ id: e.id, company_name: e.companyName, position: e.position, description: e.description ?? null, start_date: e.startDate, end_date: e.endDate ?? null });
export const educationView = (e: ResumeEducation) => ({ id: e.id, institution: e.institution, degree: e.degree ?? null, field_of_study: e.fieldOfStudy ?? null, start_year: e.startYear, end_year: e.endYear ?? null });

const group = <T>(items: T[], key: (i: T) => string) => {
    const m = new Map<string, T[]>();
    for (const i of items) { const k = key(i); if (!m.has(k)) m.set(k, []); m.get(k)!.push(i); }
    return m;
};

// Собирает резюме для ответа. detail = true добавляет места работы и образование.
// Результат совпадает с InternalResume (openapi-internal.yaml) и с публичной карточкой резюме.
export const assemble = async (rs: Resume[], detail: boolean) => {
    if (!rs.length) return [];
    const ids = rs.map((r) => r.id);
    const [ind, exps, skillRows, edus] = await Promise.all([
        refs.industries.get(rs.map((r) => r.industryId)),
        dataSource.getRepository(ResumeExperience).find({ where: { resumeId: In(ids) }, order: { startDate: 'DESC' } }),
        dataSource.getRepository(ResumeSkill).find({ where: { resumeId: In(ids) } }),
        detail ? dataSource.getRepository(ResumeEducation).find({ where: { resumeId: In(ids) }, order: { startYear: 'DESC' } }) : Promise.resolve([] as ResumeEducation[]),
    ]);
    const names = await refs.skills.get(skillRows.map((s) => s.skillId));
    const eMap = group(exps, (e) => e.resumeId), sMap = group(skillRows, (s) => s.resumeId), dMap = group(edus, (e) => e.resumeId);
    return rs.map((r) => {
        const es = eMap.get(r.id) || [];
        const out: any = {
            id: r.id, user_id: r.userId, title: r.title, summary: r.summary ?? null, industry: { id: r.industryId, title: ind.get(r.industryId)?.title ?? '' },
            salary_exp_from: r.salaryExpFrom, salary_exp_to: r.salaryExpTo, is_published: r.isPublished, total_experience_months: totalExperienceMonths(es),
            skills: (sMap.get(r.id) || []).map((s) => ({ id: s.skillId, name: names.get(s.skillId)?.name ?? '' })).sort((a, b) => a.name.localeCompare(b.name)),
            created_at: r.createdAt, updated_at: r.updatedAt,
        };
        if (detail) { out.experiences = es.map(experienceView); out.educations = (dMap.get(r.id) || []).map(educationView); }
        return out;
    });
};
export const shortView = (x: any) => ({
    id: x.id, title: x.title, industry: x.industry, salary_exp_from: x.salary_exp_from, salary_exp_to: x.salary_exp_to,
    is_published: x.is_published, total_experience_months: x.total_experience_months, updated_at: x.updated_at,
});

// ---------- события ----------
export const touch = (m: EntityManager, id: string) => m.update(Resume, { id }, { updatedAt: new Date() });
export const emitResumeUpsert = async (m: EntityManager, resumeId: string) => {
    const r = await m.findOneByOrFail(Resume, { id: resumeId });
    const exps = await m.find(ResumeExperience, { where: { resumeId } });
    const sk = await m.find(ResumeSkill, { where: { resumeId } });
    await publishEvent(m, 'resume.upserted', {
        resume_id: r.id, user_id: r.userId, industry_id: r.industryId, salary_exp_from: r.salaryExpFrom, salary_exp_to: r.salaryExpTo, is_published: r.isPublished,
        experience_periods: exps.map((e) => ({ start_date: e.startDate, end_date: e.endDate ?? null })), skill_ids: sk.map((s) => s.skillId), updated_at: r.updatedAt.toISOString(),
    });
};
