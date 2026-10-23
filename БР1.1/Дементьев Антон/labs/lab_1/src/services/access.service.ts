import { In } from 'typeorm';

import dataSource from '../config/data-source';
import { fail, invalid } from '../common/errors';
import { uuidParam } from '../common/validators';
import { Company } from '../models/company.entity';
import { Industry } from '../models/industry.entity';
import { Resume } from '../models/resume.entity';
import { Skill } from '../models/skill.entity';
import { Vacancy } from '../models/vacancy.entity';

// Ищет резюме и проверяет, что оно принадлежит пользователю 
export const loadOwnedResume = async (id: string, userId: string) => {
    const resume = await dataSource.getRepository(Resume).findOne({
        where: { id: uuidParam(id, 'RESUME_NOT_FOUND') },
        relations: { industry: true },
    });
    if (!resume) throw fail('RESUME_NOT_FOUND');
    if (resume.userId !== userId) throw fail('FORBIDDEN');
    return resume;
};

export const loadOwnedCompany = async (id: string, userId: string) => {
    const company = await dataSource.getRepository(Company).findOne({
        where: { id: uuidParam(id, 'COMPANY_NOT_FOUND') },
        relations: { industry: true },
    });
    if (!company) throw fail('COMPANY_NOT_FOUND');
    if (company.ownerUserId !== userId) throw fail('FORBIDDEN');
    return company;
};

// Вакансия вместе с компанией и отраслью; проверяет владельца компании
export const loadOwnedVacancy = async (id: string, userId: string) => {
    const vacancy = await dataSource.getRepository(Vacancy).findOne({
        where: { id: uuidParam(id, 'VACANCY_NOT_FOUND') },
        relations: { company: { industry: true }, industry: true },
    });
    if (!vacancy) throw fail('VACANCY_NOT_FOUND');
    if (vacancy.company.ownerUserId !== userId) throw fail('FORBIDDEN');
    return vacancy;
};

// Ссылка на отрасль из тела запроса: если такой нет, ошибка валидации 422
export const requireIndustry = async (industryId: string) => {
    const industry = await dataSource
        .getRepository(Industry)
        .findOneBy({ id: industryId });
    if (!industry) throw invalid('industry_id', 'Отрасль не найдена');
    return industry;
};

// Проверяет, что все навыки существуют. Возвращает их (без дублей) 
export const requireSkills = async (skillIds: string[], field: string) => {
    const unique = Array.from(new Set(skillIds));
    if (unique.length === 0) return [];
    const skills = await dataSource.getRepository(Skill).findBy({ id: In(unique) });
    if (skills.length !== unique.length) {
        throw invalid(field, 'Часть навыков не найдена в справочнике');
    }
    return skills;
};

// Проверка вилки зарплаты: от/до
export const checkSalaryRange = (
    from: number | null | undefined,
    to: number | null | undefined,
    fromField: string,
) => {
    if (from != null && to != null && from > to) {
        throw invalid(fromField, 'Нижняя граница не может быть больше верхней');
    }
};
