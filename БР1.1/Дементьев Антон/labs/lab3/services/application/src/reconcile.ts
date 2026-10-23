import { In } from 'typeorm';
import { ApplicationStatus, lookupResumes, lookupVacancies } from '@jobsearch/common';
import { dataSource } from './db';
import { Application } from './models/application.entity';

// Сверка целостности: отклики, чьи вакансия или резюме уже не существуют, получают статус REJECTED
export async function reconcile() {
    const repo = dataSource.getRepository(Application);
    const OPEN = [ApplicationStatus.PENDING, ApplicationStatus.VIEWED, ApplicationStatus.INVITED];
    for (const kind of ['vacancy', 'resume'] as const) {
        const col = kind === 'vacancy' ? 'vacancy_id' : 'resume_id';
        const rows: { id: string }[] = await dataSource.query(`SELECT DISTINCT ${col} AS id FROM applications`);
        for (let i = 0; i < rows.length; i += 100) {
            const ids = rows.slice(i, i + 100).map((r) => r.id);
            const found = await (kind === 'vacancy' ? lookupVacancies(ids) : lookupResumes(ids));
            const missing = ids.filter((id) => !found.has(id));
            if (missing.length) {
                const r = await repo.update({ [kind === 'vacancy' ? 'vacancyId' : 'resumeId']: In(missing), status: In(OPEN) }, { status: ApplicationStatus.REJECTED });
                console.log(`[сверка] ${kind}: отсутствуют ${missing.length}, отклонено откликов: ${r.affected}`);
            }
        }
    }
}
export const startReconcileJob = () => {
    const every = parseInt(process.env.RECONCILE_INTERVAL_MS || '3600000');
    setTimeout(() => reconcile().catch((e) => console.warn('[сверка]', e?.code || e?.message)), 60000);
    setInterval(() => reconcile().catch((e) => console.warn('[сверка]', e?.code || e?.message)), every);
};
