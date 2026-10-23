import dataSource from '../config/data-source';
import { Company } from '../models/company.entity';
import { Vacancy } from '../models/vacancy.entity';
import { VacancySkill } from '../models/vacancy-skill.entity';
import { industryView, skillView } from './common.view';

export const companyShortView = (c: Company) => ({
    id: c.id,
    name: c.name,
    website_url: c.websiteUrl ?? null,
});

// Компания загружена вместе с industry
export const companyView = (c: Company) => ({
    id: c.id,
    name: c.name,
    industry: industryView(c.industry),
    description: c.description ?? null,
    website_url: c.websiteUrl ?? null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
});

// Карточка вакансии в списке. Вакансия загружена вместе с company и industry.
export const vacancyShortView = (v: Vacancy) => ({
    id: v.id,
    title: v.title,
    company: companyShortView(v.company),
    industry: industryView(v.industry),
    salary_from: v.salaryFrom,
    salary_to: v.salaryTo,
    min_experience_years: v.minExperienceYears,
    is_active: v.isActive,
    created_at: v.createdAt,
});

export const vacancySkillView = (vs: VacancySkill) => ({
    skill: skillView(vs.skill),
    is_required: vs.isRequired,
});

export const loadVacancySkills = async (vacancyId: string) => {
    const list = await dataSource
        .getRepository(VacancySkill)
        .find({ where: { vacancyId }, relations: { skill: true } });
    return list.sort((a, b) => a.skill.name.localeCompare(b.skill.name));
};

// Страница вакансии с деталями. Вакансия загружена вместе с company.industry и industry.
export const buildVacancyDetail = async (v: Vacancy) => {
    const skills = await loadVacancySkills(v.id);
    return {
        id: v.id,
        title: v.title,
        description: v.description,
        requirements: v.requirements ?? null,
        company: companyView(v.company),
        industry: industryView(v.industry),
        salary_from: v.salaryFrom,
        salary_to: v.salaryTo,
        min_experience_years: v.minExperienceYears,
        skills: skills.map(vacancySkillView),
        is_active: v.isActive,
        created_at: v.createdAt,
        updated_at: v.updatedAt,
    };
};
