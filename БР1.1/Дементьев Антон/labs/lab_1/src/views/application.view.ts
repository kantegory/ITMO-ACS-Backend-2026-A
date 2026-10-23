import { In } from 'typeorm';

import dataSource from '../config/data-source';
import { Application } from '../models/application.entity';
import { UserProfile } from '../models/user-profile.entity';
import { User } from '../models/user.entity';
import { applicantShortView, applicantView } from './user.view';
import { buildResumeDetail, buildResumeShorts } from './resume.view';
import { vacancyShortView } from './vacancy.view';

// Загрузка откликов вместе со всем нужным для карточек
export const APPLICATION_RELATIONS = {
    vacancy: { company: true, industry: true },
    resume: { industry: true },
} as const;

export const loadProfiles = async (userIds: string[]) => {
    const map = new Map<string, UserProfile>();
    if (userIds.length === 0) return map;
    const list = await dataSource
        .getRepository(UserProfile)
        .find({ where: { userId: In(userIds) } });
    list.forEach((p) => map.set(p.userId, p));
    return map;
};

// Отклики в списке. Загружены с APPLICATION_RELATIONS.
export const buildApplicationList = async (apps: Application[]) => {
    const resumes = await buildResumeShorts(apps.map((a) => a.resume));
    const resumeById = new Map(resumes.map((r) => [r.id, r]));
    const profiles = await loadProfiles(apps.map((a) => a.resume.userId));

    return apps.map((a) => ({
        id: a.id,
        status: a.status,
        cover_letter: a.coverLetter ?? null,
        created_at: a.createdAt,
        updated_at: a.updatedAt,
        vacancy: vacancyShortView(a.vacancy),
        resume: resumeById.get(a.resume.id),
        applicant: applicantShortView(a.resume.userId, profiles.get(a.resume.userId)),
    }));
};

// Полная карточка отклика. Загружен с APPLICATION_RELATIONS.
export const buildApplicationDetail = async (a: Application) => {
    const [profiles, owner, resume] = await Promise.all([
        loadProfiles([a.resume.userId]),
        dataSource.getRepository(User).findOneByOrFail({ id: a.resume.userId }),
        buildResumeDetail(a.resume),
    ]);
    return {
        id: a.id,
        status: a.status,
        cover_letter: a.coverLetter ?? null,
        created_at: a.createdAt,
        updated_at: a.updatedAt,
        vacancy: vacancyShortView(a.vacancy),
        resume,
        applicant: applicantView(owner, profiles.get(owner.id)),
    };
};

// Ответ на создание отклика / смену статуса — без вложенных карточек
export const applicationView = (a: Application) => ({
    id: a.id,
    vacancy_id: a.vacancyId,
    resume_id: a.resumeId,
    status: a.status,
    cover_letter: a.coverLetter ?? null,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
});
