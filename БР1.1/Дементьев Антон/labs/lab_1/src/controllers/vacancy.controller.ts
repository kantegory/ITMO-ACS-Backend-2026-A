import {
    Body,
    Delete,
    Get,
    JsonController,
    Param,
    Patch,
    Post,
    Put,
    QueryParams,
    Req,
    Res,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Response } from 'express';

import dataSource from '../config/data-source';
import { fail, invalid } from '../common/errors';
import { created, noContent } from '../common/http';
import { pageOptions, paginate } from '../common/pagination';
import { escapeLike, uuidParam } from '../common/validators';
import {
    CreateVacancyDto,
    SearchVacanciesQuery,
    SetVacancySkillsDto,
    UpdateVacancyDto,
} from '../dto/vacancy.dto';
import authMiddleware, {
    optionalAuthMiddleware,
    requireRole,
    RequestWithUser,
} from '../middlewares/auth.middleware';
import { Application } from '../models/application.entity';
import { Company } from '../models/company.entity';
import { Role } from '../models/enums';
import { Vacancy } from '../models/vacancy.entity';
import { VacancySkill } from '../models/vacancy-skill.entity';
import {
    checkSalaryRange,
    loadOwnedVacancy,
    requireIndustry,
    requireSkills,
} from '../services/access.service';
import {
    buildVacancyDetail,
    loadVacancySkills,
    vacancyShortView,
    vacancySkillView,
} from '../views/vacancy.view';

const AUTH = { security: [{ bearerAuth: [] }] };
const EMPLOYER = [authMiddleware, requireRole(Role.EMPLOYER)];

@JsonController('/vacancies')
class VacancyController {
    private vacancies = () => dataSource.getRepository(Vacancy);

    // Поиск среди открытых вакансий с фильтрами
    @Get('')
    @OpenAPI({ summary: 'Поиск вакансий' })
    async search(@QueryParams({ type: SearchVacanciesQuery }) query: SearchVacanciesQuery) {
        if (
            query.salary_min !== undefined &&
            query.salary_max !== undefined &&
            query.salary_min > query.salary_max
        ) {
            throw invalid('salary_min', 'salary_min не может быть больше salary_max');
        }

        const qb = this.vacancies()
            .createQueryBuilder('v')
            .innerJoinAndSelect('v.company', 'c')
            .innerJoinAndSelect('v.industry', 'i')
            .where('v.isActive = true');

        if (query.q) {
            qb.andWhere('(v.title ILIKE :q OR v.description ILIKE :q)', {
                q: `%${escapeLike(query.q)}%`,
            });
        }
        if (query.industry_id) qb.andWhere('v.industryId = :industryId', { industryId: query.industry_id });
        if (query.company_id) qb.andWhere('v.companyId = :companyId', { companyId: query.company_id });
        // «salary_min»: верхняя граница вакансии не ниже значения (без зарплаты — не подходит)
        if (query.salary_min !== undefined) qb.andWhere('v.salaryTo >= :salaryMin', { salaryMin: query.salary_min });
        // «salary_max»: нижняя граница вакансии не выше значения
        if (query.salary_max !== undefined) qb.andWhere('v.salaryFrom <= :salaryMax', { salaryMax: query.salary_max });
        if (query.experience_years !== undefined) {
            qb.andWhere('v.minExperienceYears <= :years', { years: query.experience_years });
        }

        if (query.skill_ids && query.skill_ids.length > 0) {
            const skillIds = Array.from(new Set(query.skill_ids));
            if (query.skills_match === 'all') {
                qb.andWhere(
                    `v.id IN (SELECT vs.vacancy_id FROM vacancy_skills vs
                              WHERE vs.skill_id IN (:...skillIds)
                              GROUP BY vs.vacancy_id
                              HAVING COUNT(DISTINCT vs.skill_id) = :skillCount)`,
                    { skillIds, skillCount: skillIds.length },
                );
            } else {
                qb.andWhere(
                    `v.id IN (SELECT vs.vacancy_id FROM vacancy_skills vs WHERE vs.skill_id IN (:...skillIds))`,
                    { skillIds },
                );
            }
        }

        if (query.sort === 'salary_desc') qb.orderBy('v.salaryTo', 'DESC', 'NULLS LAST');
        else if (query.sort === 'salary_asc') qb.orderBy('v.salaryFrom', 'ASC', 'NULLS LAST');
        else qb.orderBy('v.createdAt', 'DESC');
        qb.addOrderBy('v.id', 'ASC');

        const [list, total] = await qb.skip((query.page - 1) * query.size).take(query.size).getManyAndCount();
        return paginate(list.map(vacancyShortView), query.page, query.size, total);
    }

    @Post('')
    @UseBefore(...EMPLOYER)
    @OpenAPI({ summary: 'Создание вакансии', ...AUTH })
    async create(@Req() req: RequestWithUser, @Body({ type: CreateVacancyDto }) body: CreateVacancyDto, @Res() res: Response) {
        // компания и отрасль берутся из тела запроса: не найдены — 422, чужая компания — 403
        const company = await dataSource.getRepository(Company).findOneBy({ id: body.company_id });
        if (!company) throw invalid('company_id', 'Компания не найдена');
        if (company.ownerUserId !== req.user!.id) throw fail('FORBIDDEN');
        await requireIndustry(body.industry_id);
        checkSalaryRange(body.salary_from, body.salary_to, 'salary_from');

        const saved = await this.vacancies().save(
            this.vacancies().create({
                companyId: company.id,
                industryId: body.industry_id,
                title: body.title,
                description: body.description,
                requirements: body.requirements ?? null,
                salaryFrom: body.salary_from ?? null,
                salaryTo: body.salary_to ?? null,
                minExperienceYears: body.min_experience_years ?? 0,
                isActive: body.is_active ?? true,
            }),
        );
        const vacancy = await loadOwnedVacancy(saved.id, req.user!.id);
        return created(res, `/vacancies/${saved.id}`, await buildVacancyDetail(vacancy));
    }

    @Get('/:vacancyId')
    @UseBefore(optionalAuthMiddleware)
    @OpenAPI({ summary: 'Страница вакансии' })
    async get(@Req() req: RequestWithUser, @Param('vacancyId') vacancyId: string) {
        const vacancy = await this.vacancies().findOne({
            where: { id: uuidParam(vacancyId, 'VACANCY_NOT_FOUND') },
            relations: { company: { industry: true }, industry: true },
        });
        if (!vacancy) throw fail('VACANCY_NOT_FOUND');
        // закрытую вакансию видит только её владелец
        if (!vacancy.isActive && vacancy.company.ownerUserId !== req.user?.id) {
            throw fail('VACANCY_NOT_FOUND');
        }
        return buildVacancyDetail(vacancy);
    }

    @Patch('/:vacancyId')
    @UseBefore(...EMPLOYER)
    @OpenAPI({ summary: 'Редактирование вакансии', ...AUTH })
    async update(
        @Req() req: RequestWithUser,
        @Param('vacancyId') vacancyId: string,
        @Body({ type: UpdateVacancyDto }) body: UpdateVacancyDto,
    ) {
        const vacancy = await loadOwnedVacancy(vacancyId, req.user!.id);
        if (body.industry_id !== undefined) await requireIndustry(body.industry_id);
        const from = body.salary_from !== undefined ? body.salary_from : vacancy.salaryFrom;
        const to = body.salary_to !== undefined ? body.salary_to : vacancy.salaryTo;
        checkSalaryRange(from, to, 'salary_from');

        if (body.industry_id !== undefined) vacancy.industryId = body.industry_id;
        if (body.title !== undefined) vacancy.title = body.title;
        if (body.description !== undefined) vacancy.description = body.description;
        if (body.requirements !== undefined) vacancy.requirements = body.requirements;
        if (body.salary_from !== undefined) vacancy.salaryFrom = body.salary_from;
        if (body.salary_to !== undefined) vacancy.salaryTo = body.salary_to;
        if (body.min_experience_years !== undefined) vacancy.minExperienceYears = body.min_experience_years;
        if (body.is_active !== undefined) vacancy.isActive = body.is_active;
        delete (vacancy as any).industry;
        delete (vacancy as any).company;
        await this.vacancies().save(vacancy);

        return buildVacancyDetail(await loadOwnedVacancy(vacancy.id, req.user!.id));
    }

    @Delete('/:vacancyId')
    @UseBefore(...EMPLOYER)
    @OpenAPI({ summary: 'Удаление вакансии', ...AUTH })
    async remove(@Req() req: RequestWithUser, @Param('vacancyId') vacancyId: string, @Res() res: Response) {
        const vacancy = await loadOwnedVacancy(vacancyId, req.user!.id);
        if (await dataSource.getRepository(Application).existsBy({ vacancyId: vacancy.id })) {
            throw fail('VACANCY_HAS_APPLICATIONS');
        }
        await this.vacancies().delete(vacancy.id);
        return noContent(res);
    }

    @Put('/:vacancyId/skills')
    @UseBefore(...EMPLOYER)
    @OpenAPI({ summary: 'Задание навыков вакансии (полная замена набора)', ...AUTH })
    async setSkills(
        @Req() req: RequestWithUser,
        @Param('vacancyId') vacancyId: string,
        @Body({ type: SetVacancySkillsDto }) body: SetVacancySkillsDto,
    ) {
        const vacancy = await loadOwnedVacancy(vacancyId, req.user!.id);

        // если один навык указан дважды, побеждает последнее значение is_required
        const required = new Map<string, boolean>();
        body.skills.forEach((s) => required.set(s.skill_id, s.is_required ?? false));
        const skills = await requireSkills(Array.from(required.keys()), 'skills');

        await dataSource.transaction(async (manager) => {
            await manager.delete(VacancySkill, { vacancyId: vacancy.id });
            if (skills.length > 0) {
                await manager.insert(
                    VacancySkill,
                    skills.map((s) => ({
                        vacancyId: vacancy.id,
                        skillId: s.id,
                        isRequired: required.get(s.id) ?? false,
                    })),
                );
            }
        });

        return { items: (await loadVacancySkills(vacancy.id)).map(vacancySkillView) };
    }
}

export default VacancyController;
