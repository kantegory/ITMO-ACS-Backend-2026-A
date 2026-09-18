import { Vacancy } from '../models/vacancy.entity';


export interface ResolvedEmployer {
    employer_id: number;
    company_name: string;
}

export interface ResolvedExperience {
    experience_id: number;
    period: string;
}

export interface ResolvedIndustry {
    industry_id: number;
    name: string;
}

export interface ResolvedSkill {
    skill_id: number;
    name: string;
}


export const serializeVacancyShort = (vacancy: Vacancy, experience?: ResolvedExperience, industry?: ResolvedIndustry) => ({
    vacancy_id: vacancy.vacancyId,
    employer_id: vacancy.employerId,
    title: vacancy.title,
    salary: vacancy.salary,
    city: vacancy.city,
    experience_id: vacancy.experienceId,
    experience: experience?.period ?? null,
    industry_id: vacancy.industryId,
    industry: industry?.name ?? null,
});

export const serializeVacancyDetail = (vacancy: Vacancy, employer?: ResolvedEmployer, experience?: ResolvedExperience, industry?: ResolvedIndustry, skills: ResolvedSkill[] = []) => ({
    vacancy_id: vacancy.vacancyId,
    employer_id: vacancy.employerId,
    company_name: employer?.company_name ?? null,
    experience_id: vacancy.experienceId,
    experience: experience?.period ?? null,
    industry_id: vacancy.industryId,
    industry: industry?.name ?? null,
    title: vacancy.title,
    description: vacancy.description,
    requirements: vacancy.requirements,
    salary: vacancy.salary,
    city: vacancy.city,
    skills: skills,
});

