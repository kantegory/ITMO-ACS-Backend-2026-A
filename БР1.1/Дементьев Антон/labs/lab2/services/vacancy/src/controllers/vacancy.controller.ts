import { Body, Delete, Get, JsonController, Param, Patch, Post, Put, QueryParams, Req, Res, UseBefore } from 'routing-controllers';
import { Response } from 'express';
import { created, dispatchSoon, escapeLike, fail, getClient, invalid, noContent, paginate, publishEvent, Role, UpstreamError, uuidParam } from '@jobsearch/common';

import { dataSource } from '../db';
import { CreateVacancyDto, SearchVacanciesQuery, SetVacancySkillsDto, UpdateVacancyDto } from '../dto/vacancy.dto';
import { authMiddleware, optionalAuthMiddleware, requireRole, RequestWithUser } from '../auth';
import { Company } from '../models/company.entity';
import { Vacancy } from '../models/vacancy.entity';
import { VacancySkill } from '../models/vacancy-skill.entity';
import { buildVacancies, checkSalaryRange, emitVacancyUpsert, industriesFor, loadOwnedVacancy, requireIndustry, requireSkills, vacancyShortView } from '../support';

const EMPLOYER = [authMiddleware, requireRole(Role.EMPLOYER)];

@JsonController('/api/v1/vacancies')
class VacancyController {
    private vacancies = () => dataSource.getRepository(Vacancy);

    // Поиск среди открытых вакансий
    @Get('')
    async search(@QueryParams({ type: SearchVacanciesQuery }) query: SearchVacanciesQuery) {
        if (query.salary_min !== undefined && query.salary_max !== undefined && query.salary_min > query.salary_max) throw invalid('salary_min', 'salary_min не может быть больше salary_max');
        const qb = this.vacancies().createQueryBuilder('v').innerJoinAndSelect('v.company', 'c').where('v.isActive = true');
        if (query.q) qb.andWhere('(v.title ILIKE :q OR v.description ILIKE :q)', { q: `%${escapeLike(query.q)}%` });
        if (query.industry_id) qb.andWhere('v.industryId = :industryId', { industryId: query.industry_id });
        if (query.company_id) qb.andWhere('v.companyId = :companyId', { companyId: query.company_id });
        if (query.salary_min !== undefined) qb.andWhere('v.salaryTo >= :salaryMin', { salaryMin: query.salary_min });
        if (query.salary_max !== undefined) qb.andWhere('v.salaryFrom <= :salaryMax', { salaryMax: query.salary_max });
        if (query.experience_years !== undefined) qb.andWhere('v.minExperienceYears <= :years', { years: query.experience_years });
        if (query.skill_ids && query.skill_ids.length > 0) {
            const skillIds = Array.from(new Set(query.skill_ids));
            if (query.skills_match === 'all') {
                qb.andWhere(`v.id IN (SELECT vs.vacancy_id FROM vacancy_skills vs WHERE vs.skill_id IN (:...skillIds) GROUP BY vs.vacancy_id HAVING COUNT(DISTINCT vs.skill_id) = :skillCount)`, { skillIds, skillCount: skillIds.length });
            } else {
                qb.andWhere(`v.id IN (SELECT vs.vacancy_id FROM vacancy_skills vs WHERE vs.skill_id IN (:...skillIds))`, { skillIds });
            }
        }
        if (query.sort === 'salary_desc') qb.orderBy('v.salaryTo', 'DESC', 'NULLS LAST');
        else if (query.sort === 'salary_asc') qb.orderBy('v.salaryFrom', 'ASC', 'NULLS LAST');
        else qb.orderBy('v.createdAt', 'DESC');
        qb.addOrderBy('v.id', 'ASC');
        const [list, total] = await qb.skip((query.page - 1) * query.size).take(query.size).getManyAndCount();
        const ind = await industriesFor(list);
        return paginate(list.map((v) => vacancyShortView(v, ind)), query.page, query.size, total);
    }

    @Post('')
    @UseBefore(...EMPLOYER)
    async create(@Req() req: RequestWithUser, @Body({ type: CreateVacancyDto }) body: CreateVacancyDto, @Res() res: Response) {
        const company = await dataSource.getRepository(Company).findOneBy({ id: body.company_id });
        if (!company) throw invalid('company_id', 'Компания не найдена');
        if (company.ownerUserId !== req.user!.id) throw fail('FORBIDDEN');
        await requireIndustry(body.industry_id);
        checkSalaryRange(body.salary_from, body.salary_to, 'salary_from');
        const id = await dataSource.transaction(async (m) => {
            const saved = await m.save(m.create(Vacancy, {
                companyId: company.id, industryId: body.industry_id, title: body.title, description: body.description, requirements: body.requirements ?? null,
                salaryFrom: body.salary_from ?? null, salaryTo: body.salary_to ?? null, minExperienceYears: body.min_experience_years ?? 0, isActive: body.is_active ?? true,
            }));
            await emitVacancyUpsert(m, saved.id);
            return saved.id;
        });
        dispatchSoon();
        const v = await loadOwnedVacancy(id, req.user!.id);
        return created(res, `/vacancies/${id}`, (await buildVacancies([v]))[0]);
    }

    @Get('/:vacancyId')
    @UseBefore(optionalAuthMiddleware)
    async get(@Req() req: RequestWithUser, @Param('vacancyId') vacancyId: string) {
        const v = await this.vacancies().findOne({ where: { id: uuidParam(vacancyId, 'VACANCY_NOT_FOUND') }, relations: { company: true } });
        if (!v) throw fail('VACANCY_NOT_FOUND');
        if (!v.isActive && v.company.ownerUserId !== req.user?.id) throw fail('VACANCY_NOT_FOUND');
        return (await buildVacancies([v]))[0];
    }

    @Patch('/:vacancyId')
    @UseBefore(...EMPLOYER)
    async update(@Req() req: RequestWithUser, @Param('vacancyId') vacancyId: string, @Body({ type: UpdateVacancyDto }) body: UpdateVacancyDto) {
        const v = await loadOwnedVacancy(vacancyId, req.user!.id);
        if (body.industry_id !== undefined) await requireIndustry(body.industry_id);
        checkSalaryRange(body.salary_from !== undefined ? body.salary_from : v.salaryFrom, body.salary_to !== undefined ? body.salary_to : v.salaryTo, 'salary_from');
        if (body.industry_id !== undefined) v.industryId = body.industry_id;
        if (body.title !== undefined) v.title = body.title;
        if (body.description !== undefined) v.description = body.description;
        if (body.requirements !== undefined) v.requirements = body.requirements;
        if (body.salary_from !== undefined) v.salaryFrom = body.salary_from;
        if (body.salary_to !== undefined) v.salaryTo = body.salary_to;
        if (body.min_experience_years !== undefined) v.minExperienceYears = body.min_experience_years;
        if (body.is_active !== undefined) v.isActive = body.is_active;
        await dataSource.transaction(async (m) => { await m.save(Vacancy, v); await emitVacancyUpsert(m, v.id); });
        dispatchSoon();
        return (await buildVacancies([await loadOwnedVacancy(v.id, req.user!.id)]))[0];
    }

    // Удаление: «сначала закрыть, потом проверить». Вакансию закрываем (новые отклики не принимаются),
    // спрашиваем Application Service, есть ли отклики, и только потом удаляем или возвращаем прежнее состояние.
    @Delete('/:vacancyId')
    @UseBefore(...EMPLOYER)
    async remove(@Req() req: RequestWithUser, @Param('vacancyId') vacancyId: string, @Res() res: Response) {
        const v = await loadOwnedVacancy(vacancyId, req.user!.id);
        const wasActive = v.isActive;
        const restore = () => wasActive ? this.vacancies().update(v.id, { isActive: true }) : Promise.resolve();
        if (wasActive) await this.vacancies().update(v.id, { isActive: false });
        let exists: { exists: boolean };
        try {
            exists = await getClient().call('application-service', 'GET', '/internal/v1/applications/exists', { query: { vacancy_id: v.id } });
        } catch (e) {
            await restore();
            throw e instanceof UpstreamError ? fail('INTERNAL_ERROR') : e;
        }
        if (exists.exists) { await restore(); throw fail('VACANCY_HAS_APPLICATIONS'); }
        await dataSource.transaction(async (m) => {
            await m.delete(Vacancy, { id: v.id });
            await publishEvent(m, 'vacancy.deleted', { vacancy_id: v.id, deleted_at: new Date().toISOString() });
        });
        dispatchSoon();
        return noContent(res);
    }

    @Put('/:vacancyId/skills')
    @UseBefore(...EMPLOYER)
    async setSkills(@Req() req: RequestWithUser, @Param('vacancyId') vacancyId: string, @Body({ type: SetVacancySkillsDto }) body: SetVacancySkillsDto) {
        const v = await loadOwnedVacancy(vacancyId, req.user!.id);
        const required = new Map<string, boolean>();
        body.skills.forEach((s) => required.set(s.skill_id, s.is_required ?? false));
        await requireSkills(Array.from(required.keys()), 'skills');
        await dataSource.transaction(async (m) => {
            await m.delete(VacancySkill, { vacancyId: v.id });
            if (required.size) await m.insert(VacancySkill, Array.from(required.entries()).map(([skillId, isRequired]) => ({ vacancyId: v.id, skillId, isRequired })));
            await m.update(Vacancy, { id: v.id }, { updatedAt: new Date() });
            await emitVacancyUpsert(m, v.id);
        });
        dispatchSoon();
        return { items: (await buildVacancies([await loadOwnedVacancy(v.id, req.user!.id)]))[0].skills };
    }
}
export default VacancyController;
