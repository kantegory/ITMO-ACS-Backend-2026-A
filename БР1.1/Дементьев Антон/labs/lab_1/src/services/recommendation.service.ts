import { In } from 'typeorm';

import dataSource from '../config/data-source';
import { Resume } from '../models/resume.entity';
import { ResumeExperience } from '../models/resume-experience.entity';
import { Skill } from '../models/skill.entity';
import { Vacancy } from '../models/vacancy.entity';
import { VacancySkill } from '../models/vacancy-skill.entity';
import { skillView } from '../views/common.view';
import { groupBy, loadExperiences, loadResumeSkills, totalExperienceMonths } from '../views/resume.view';

// Веса критериев (в сумме 100). Обязательные навыки весят больше необязательных.
const W = { required: 40, optional: 10, experience: 20, industry: 20, salary: 10 };

interface ResumeCtx {
    resume: Resume;
    skillIds: Set<string>;
    skills: Map<string, Skill>;
    experienceMonths: number;
}

interface VacancyCtx {
    vacancy: Vacancy;
    required: Skill[];
    optional: Skill[];
}

const rangesOverlap = (
    aFrom: number | null,
    aTo: number | null,
    bFrom: number | null,
    bTo: number | null,
): boolean => {
    const lo = Math.max(aFrom ?? -Infinity, bFrom ?? -Infinity);
    const hi = Math.min(aTo ?? Infinity, bTo ?? Infinity);
    return lo <= hi;
};

// Считает соответствие резюме и вакансии (0–100) 
// Что нельзя подтвердить данными (например, у вакансии не указана зарплата), очков не даёт 
export const score = (r: ResumeCtx, v: VacancyCtx) => {
    let points = 0;

    const matchedRequired = v.required.filter((s) => r.skillIds.has(s.id));
    const matchedOptional = v.optional.filter((s) => r.skillIds.has(s.id));
    const hasAnySkills = v.required.length + v.optional.length > 0;

    // обязательные навыки: доля совпавших. Если у вакансии только необязательные, требовать нечего
    if (v.required.length > 0) {
        points += W.required * (matchedRequired.length / v.required.length);
    } else if (hasAnySkills) {
        points += W.required;
    }
    // необязательные навыки: то же самое
    if (v.optional.length > 0) {
        points += W.optional * (matchedOptional.length / v.optional.length);
    } else if (hasAnySkills) {
        points += W.optional;
    }

    // стаж резюме против требуемого опыта вакансии
    const needMonths = v.vacancy.minExperienceYears * 12;
    points += W.experience * (needMonths === 0 ? 1 : Math.min(r.experienceMonths / needMonths, 1));

    // совпадение отрасли
    if (r.resume.industryId === v.vacancy.industryId) points += W.industry;

    // зарплатные вилки: очки только если указано с обеих сторон и вилки пересекаются
    const resumeHasSalary = r.resume.salaryExpFrom != null || r.resume.salaryExpTo != null;
    const vacancyHasSalary = v.vacancy.salaryFrom != null || v.vacancy.salaryTo != null;
    if (
        resumeHasSalary &&
        vacancyHasSalary &&
        rangesOverlap(r.resume.salaryExpFrom, r.resume.salaryExpTo, v.vacancy.salaryFrom, v.vacancy.salaryTo)
    ) {
        points += W.salary;
    }

    return {
        match_score: Math.round(points),
        matched_skills: [...matchedRequired, ...matchedOptional]
            .map(skillView)
            .sort((a, b) => a.name.localeCompare(b.name)),
        missing_required_skills: v.required
            .filter((s) => !r.skillIds.has(s.id))
            .map(skillView)
            .sort((a, b) => a.name.localeCompare(b.name)),
    };
};

export const buildResumeCtxs = async (resumes: Resume[]): Promise<ResumeCtx[]> => {
    const ids = resumes.map((r) => r.id);
    const [skills, exps] = await Promise.all([loadResumeSkills(ids), loadExperiences(ids)]);
    return resumes.map((resume) => {
        const list = skills.get(resume.id) || [];
        return {
            resume,
            skillIds: new Set(list.map((rs) => rs.skillId)),
            skills: new Map(list.map((rs) => [rs.skillId, rs.skill])),
            experienceMonths: totalExperienceMonths(exps.get(resume.id) || ([] as ResumeExperience[])),
        };
    });
};

export const buildVacancyCtxs = async (vacancies: Vacancy[]): Promise<VacancyCtx[]> => {
    if (vacancies.length === 0) return [];
    const all = await dataSource
        .getRepository(VacancySkill)
        .find({ where: { vacancyId: In(vacancies.map((v) => v.id)) }, relations: { skill: true } });
    const byVacancy = groupBy(all, (vs) => vs.vacancyId);
    return vacancies.map((vacancy) => {
        const list = byVacancy.get(vacancy.id) || [];
        return {
            vacancy,
            required: list.filter((vs) => vs.isRequired).map((vs) => vs.skill),
            optional: list.filter((vs) => !vs.isRequired).map((vs) => vs.skill),
        };
    });
};
