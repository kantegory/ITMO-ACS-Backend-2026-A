import { EntityManager } from 'typeorm';
import { getClient } from '@jobsearch/common';

import { dataSource } from './db';
import { IndexJob, ResumeIndex, ResumeSkillIndex, VacancyIndex, VacancySkillIndex } from './models/index.entities';

// Обновление индекса. Событие старее сохранённой версии игнорируется (force = true при полной загрузке).
export const upsertVacancy = async (m: EntityManager, p: any, force = false) => {
    const cur = await m.findOneBy(VacancyIndex, { vacancyId: p.vacancy_id });
    if (!force && cur && cur.sourceUpdatedAt > new Date(p.updated_at)) return;
    await m.save(VacancyIndex, {
        vacancyId: p.vacancy_id, industryId: p.industry_id, salaryFrom: p.salary_from, salaryTo: p.salary_to, minExperienceYears: p.min_experience_years,
        isActive: p.is_active, sourceCreatedAt: new Date(p.created_at), sourceUpdatedAt: new Date(p.updated_at),
    });
    await m.delete(VacancySkillIndex, { vacancyId: p.vacancy_id });
    if (p.skills?.length) await m.insert(VacancySkillIndex, p.skills.map((s: any) => ({ vacancyId: p.vacancy_id, skillId: s.skill_id, isRequired: s.is_required })));
};
export const deleteVacancy = async (m: EntityManager, id: string) => {
    await m.delete(VacancySkillIndex, { vacancyId: id });
    await m.delete(VacancyIndex, { vacancyId: id });
};
export const upsertResume = async (m: EntityManager, p: any, force = false) => {
    const cur = await m.findOneBy(ResumeIndex, { resumeId: p.resume_id });
    if (!force && cur && cur.sourceUpdatedAt > new Date(p.updated_at)) return;
    if (p.is_published === false) return deleteResume(m, p.resume_id);
    await m.save(ResumeIndex, {
        resumeId: p.resume_id, userId: p.user_id, industryId: p.industry_id, salaryExpFrom: p.salary_exp_from, salaryExpTo: p.salary_exp_to,
        experiencePeriods: p.experience_periods || [], sourceUpdatedAt: new Date(p.updated_at),
    });
    await m.delete(ResumeSkillIndex, { resumeId: p.resume_id });
    if (p.skill_ids?.length) await m.insert(ResumeSkillIndex, p.skill_ids.map((skillId: string) => ({ resumeId: p.resume_id, skillId })));
};
export const deleteResume = async (m: EntityManager, id: string) => {
    await m.delete(ResumeSkillIndex, { resumeId: id });
    await m.delete(ResumeIndex, { resumeId: id });
};

// Полная загрузка индекса из выгрузок Vacancy и Resume (задача index_jobs)
export async function rebuild(scope: string, jobId: string) {
    const jobs = dataSource.getRepository(IndexJob);
    await jobs.update(jobId, { status: 'RUNNING' });
    let processed = 0;
    const client = getClient();
    try {
        for (const kind of ['vacancy', 'resume'] as const) {
            if (scope !== 'ALL' && scope !== (kind === 'vacancy' ? 'VACANCIES' : 'RESUMES')) continue;
            const seen: string[] = [];
            let cursor: string | undefined;
            do {
                const page: any = await client.call(kind === 'vacancy' ? 'vacancy-service' : 'resume-service', 'GET', `/internal/v1/${kind === 'vacancy' ? 'vacancies' : 'resumes'}/export`, { query: { cursor, limit: 200 }, timeoutMs: 5000 });
                await dataSource.transaction(async (m) => {
                    for (const rec of page.items) {
                        if (kind === 'vacancy') { await upsertVacancy(m, rec, true); seen.push(rec.vacancy_id); }
                        else { await upsertResume(m, rec, true); seen.push(rec.resume_id); }
                    }
                });
                processed += page.items.length;
                await jobs.update(jobId, { processedItems: processed });
                cursor = page.next_cursor || undefined;
            } while (cursor);
            // записи, которых больше нет в источнике, удаляются из индекса
            if (kind === 'vacancy') {
                await dataSource.query('DELETE FROM vacancy_skill_index WHERE NOT (vacancy_id = ANY($1::uuid[]))', [seen]);
                await dataSource.query('DELETE FROM vacancy_index WHERE NOT (vacancy_id = ANY($1::uuid[]))', [seen]);
            } else {
                await dataSource.query('DELETE FROM resume_skill_index WHERE NOT (resume_id = ANY($1::uuid[]))', [seen]);
                await dataSource.query('DELETE FROM resume_index WHERE NOT (resume_id = ANY($1::uuid[]))', [seen]);
            }
        }
        await jobs.update(jobId, { status: 'DONE', finishedAt: new Date() });
        return true;
    } catch (e: any) {
        console.warn(`[индекс] перестроение не удалось: ${e?.code || e?.message}`);
        await jobs.update(jobId, { status: 'FAILED', finishedAt: new Date() });
        return false;
    }
}

// При первом запуске (индекс пуст) загружаем его из источников; сервисы могут ещё стартовать, поэтому повторяем
export async function autoBuild() {
    const empty = (await dataSource.getRepository(VacancyIndex).count()) === 0 && (await dataSource.getRepository(ResumeIndex).count()) === 0;
    if (!empty) return;
    for (let i = 0; i < 60; i++) {
        const job = await dataSource.getRepository(IndexJob).save({ scope: 'ALL', status: 'QUEUED' });
        if (await rebuild('ALL', job.id)) { console.log('[индекс] первичная загрузка выполнена'); return; }
        await new Promise((r) => setTimeout(r, 5000));
    }
}
