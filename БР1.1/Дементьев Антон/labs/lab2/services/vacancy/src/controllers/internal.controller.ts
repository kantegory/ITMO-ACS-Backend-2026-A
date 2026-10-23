import { IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Body, Get, JsonController, Param, Post, QueryParams } from 'routing-controllers';
import { In, MoreThan } from 'typeorm';
import { fail, IdsDto, isUuid } from '@jobsearch/common';

import { dataSource } from '../db';
import { Vacancy } from '../models/vacancy.entity';
import { VacancySkill } from '../models/vacancy-skill.entity';
import { internalVacancies } from '../support';

class ExportQuery {
    @IsOptional() @IsISO8601() updated_after?: string;
    @IsOptional() @IsString() cursor?: string;
    @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) limit: number = 200;
}

@JsonController('/internal/v1/vacancies')
class InternalController {
    // Выгрузка для индекса рекомендаций: постранично, по возрастанию id (курсор = id последней записи)
    @Get('/export')
    async export(@QueryParams({ type: ExportQuery }) q: ExportQuery) {
        const cursor = q.cursor ? Buffer.from(q.cursor, 'base64url').toString() : undefined;
        const qb = dataSource.getRepository(Vacancy).createQueryBuilder('v').orderBy('v.id', 'ASC').limit(q.limit + 1);
        if (cursor && isUuid(cursor)) qb.andWhere('v.id > :cursor', { cursor });
        if (q.updated_after) qb.andWhere('v.updatedAt > :ua', { ua: new Date(q.updated_after) });
        const rows = await qb.getMany();
        const more = rows.length > q.limit;
        const page = rows.slice(0, q.limit);
        const skills = await dataSource.getRepository(VacancySkill).find({ where: { vacancyId: In(page.map((v) => v.id)) } });
        const items = page.map((v) => ({
            vacancy_id: v.id, industry_id: v.industryId, salary_from: v.salaryFrom, salary_to: v.salaryTo, min_experience_years: v.minExperienceYears, is_active: v.isActive,
            skills: skills.filter((s) => s.vacancyId === v.id).map((s) => ({ skill_id: s.skillId, is_required: s.isRequired })),
            created_at: v.createdAt.toISOString(), updated_at: v.updatedAt.toISOString(),
        }));
        return { items, next_cursor: more ? Buffer.from(page[page.length - 1].id).toString('base64url') : null };
    }

    @Post('/lookup')
    async lookup(@Body({ type: IdsDto }) body: IdsDto) {
        const ids = Array.from(new Set(body.ids));
        const list = await dataSource.getRepository(Vacancy).find({ where: { id: In(ids) }, relations: { company: true } });
        const found = new Set(list.map((v) => v.id));
        return { items: await internalVacancies(list), missing_ids: ids.filter((i) => !found.has(i)) };
    }

    @Get('/:vacancyId')
    async get(@Param('vacancyId') vacancyId: string) {
        const v = isUuid(vacancyId) ? await dataSource.getRepository(Vacancy).findOne({ where: { id: vacancyId }, relations: { company: true } }) : null;
        if (!v) throw fail('VACANCY_NOT_FOUND');
        return (await internalVacancies([v]))[0];
    }
}
export default InternalController;
