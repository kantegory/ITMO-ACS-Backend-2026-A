import { In } from 'typeorm';

import dataSource from '../config/data-source';
import { Resume } from '../models/resume.entity';
import { ResumeExperience } from '../models/resume-experience.entity';
import { ResumeEducation } from '../models/resume-education.entity';
import { ResumeSkill } from '../models/resume-skill.entity';
import { industryView, skillView } from './common.view';

// Сколько полных месяцев между двумя датами (конец = null означает «по сегодня»)
export const monthsBetween = (start: string, end: string | null): number => {
    const s = new Date(start);
    const e = end ? new Date(end) : new Date();
    let months =
        (e.getUTCFullYear() - s.getUTCFullYear()) * 12 +
        (e.getUTCMonth() - s.getUTCMonth());
    if (e.getUTCDate() < s.getUTCDate()) months -= 1;
    return Math.max(months, 0);
};

// Суммарный стаж резюме вычисляется по местам работы (в самом резюме он не хранится)
export const totalExperienceMonths = (experiences: ResumeExperience[]): number =>
    experiences.reduce((sum, e) => sum + monthsBetween(e.startDate, e.endDate), 0);

export const groupBy = <T>(items: T[], key: (item: T) => string): Map<string, T[]> => {
    const map = new Map<string, T[]>();
    for (const item of items) {
        const k = key(item);
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(item);
    }
    return map;
};

export const loadExperiences = async (resumeIds: string[]) => {
    if (resumeIds.length === 0) return new Map<string, ResumeExperience[]>();
    const list = await dataSource
        .getRepository(ResumeExperience)
        .find({ where: { resumeId: In(resumeIds) }, order: { startDate: 'DESC' } });
    return groupBy(list, (e) => e.resumeId);
};

export const loadResumeSkills = async (resumeIds: string[]) => {
    if (resumeIds.length === 0) return new Map<string, ResumeSkill[]>();
    const list = await dataSource
        .getRepository(ResumeSkill)
        .find({ where: { resumeId: In(resumeIds) }, relations: { skill: true } });
    return groupBy(list, (s) => s.resumeId);
};

// Краткая карточка резюме. Резюме должны быть загружены вместе с industry.
export const buildResumeShorts = async (resumes: Resume[]) => {
    const exps = await loadExperiences(resumes.map((r) => r.id));
    return resumes.map((r) => ({
        id: r.id,
        title: r.title,
        industry: industryView(r.industry),
        salary_exp_from: r.salaryExpFrom,
        salary_exp_to: r.salaryExpTo,
        is_published: r.isPublished,
        total_experience_months: totalExperienceMonths(exps.get(r.id) || []),
        updated_at: r.updatedAt,
    }));
};

export const experienceView = (e: ResumeExperience) => ({
    id: e.id,
    company_name: e.companyName,
    position: e.position,
    description: e.description ?? null,
    start_date: e.startDate,
    end_date: e.endDate ?? null,
});

export const educationView = (e: ResumeEducation) => ({
    id: e.id,
    institution: e.institution,
    degree: e.degree ?? null,
    field_of_study: e.fieldOfStudy ?? null,
    start_year: e.startYear,
    end_year: e.endYear ?? null,
});

// Полная карточка резюме: опыт, образование, навыки. Резюме загружено вместе с industry.
export const buildResumeDetail = async (r: Resume) => {
    const [exps, edus, skills] = await Promise.all([
        loadExperiences([r.id]),
        dataSource
            .getRepository(ResumeEducation)
            .find({ where: { resumeId: r.id }, order: { startYear: 'DESC' } }),
        loadResumeSkills([r.id]),
    ]);
    const experiences = exps.get(r.id) || [];
    return {
        id: r.id,
        user_id: r.userId,
        title: r.title,
        summary: r.summary ?? null,
        industry: industryView(r.industry),
        salary_exp_from: r.salaryExpFrom,
        salary_exp_to: r.salaryExpTo,
        is_published: r.isPublished,
        total_experience_months: totalExperienceMonths(experiences),
        experiences: experiences.map(experienceView),
        educations: edus.map(educationView),
        skills: (skills.get(r.id) || [])
            .map((rs) => skillView(rs.skill))
            .sort((a, b) => a.name.localeCompare(b.name)),
        created_at: r.createdAt,
        updated_at: r.updatedAt,
    };
};
