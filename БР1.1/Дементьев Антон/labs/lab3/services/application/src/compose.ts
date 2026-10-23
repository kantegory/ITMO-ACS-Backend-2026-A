import { applicantShort, lookupResumes, lookupUsers, lookupVacancies, resumeShort, vacancyShort } from '@jobsearch/common';
import { Application } from './models/application.entity';

export const applicationView = (a: Application) => ({
    id: a.id, vacancy_id: a.vacancyId, resume_id: a.resumeId, status: a.status, cover_letter: a.coverLetter ?? null, created_at: a.createdAt, updated_at: a.updatedAt,
});

// Списки откликов: карточки вакансий, резюме и кандидатов собираются пакетными запросами к другим сервисам
export const buildList = async (apps: Application[]) => {
    const [vm, rm, um] = await Promise.all([
        lookupVacancies(apps.map((a) => a.vacancyId)),
        lookupResumes(apps.map((a) => a.resumeId), 'short'),
        lookupUsers(apps.map((a) => a.applicantUserId)),
    ]);
    return apps.filter((a) => vm.has(a.vacancyId) && rm.has(a.resumeId)).map((a) => ({
        id: a.id, status: a.status, cover_letter: a.coverLetter ?? null, created_at: a.createdAt, updated_at: a.updatedAt,
        vacancy: vacancyShort(vm.get(a.vacancyId)), resume: resumeShort(rm.get(a.resumeId)), applicant: applicantShort(a.applicantUserId, um.get(a.applicantUserId)),
    }));
};

// Полная карточка отклика: резюме целиком и контакты кандидата (контакты выдаёт только Identity этому сервису)
export const buildDetail = async (a: Application) => {
    const [vm, rm, um] = await Promise.all([lookupVacancies([a.vacancyId]), lookupResumes([a.resumeId], 'detail'), lookupUsers([a.applicantUserId], true)]);
    const u = um.get(a.applicantUserId);
    return {
        id: a.id, status: a.status, cover_letter: a.coverLetter ?? null, created_at: a.createdAt, updated_at: a.updatedAt,
        vacancy: vacancyShort(vm.get(a.vacancyId)), resume: rm.get(a.resumeId),
        applicant: { ...applicantShort(a.applicantUserId, u), email: u?.email ?? null, phone: u?.phone ?? null, city: u?.city ?? null },
    };
};
