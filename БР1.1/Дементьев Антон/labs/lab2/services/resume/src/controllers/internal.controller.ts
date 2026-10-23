import { IsIn, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, Min, ArrayMaxSize, ArrayMinSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Body, Get, JsonController, Param, Post, QueryParams } from 'routing-controllers';
import { In } from 'typeorm';
import { fail, isUuid } from '@jobsearch/common';

import { dataSource } from '../db';
import { Resume } from '../models/resume.entity';
import { ResumeExperience } from '../models/resume-experience.entity';
import { ResumeSkill } from '../models/resume-skill.entity';
import { assemble } from '../support';

class ViewQuery { @IsOptional() @IsIn(['short', 'detail']) view: 'short' | 'detail' = 'short' }
class LookupDto {
    @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @IsUUID('all', { each: true }) ids: string[];
    @IsOptional() @IsIn(['short', 'detail']) view: 'short' | 'detail' = 'short';
}
class ExportQuery {
    @IsOptional() @IsISO8601() updated_after?: string;
    @IsOptional() @IsString() cursor?: string;
    @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) limit: number = 200;
}

@JsonController('/internal/v1/resumes')
class InternalController {
    // Выгрузка опубликованных резюме для индекса рекомендаций
    @Get('/export')
    async export(@QueryParams({ type: ExportQuery }) q: ExportQuery) {
        const cursor = q.cursor ? Buffer.from(q.cursor, 'base64url').toString() : undefined;
        const qb = dataSource.getRepository(Resume).createQueryBuilder('r').where('r.isPublished = true').orderBy('r.id', 'ASC').limit(q.limit + 1);
        if (cursor && isUuid(cursor)) qb.andWhere('r.id > :cursor', { cursor });
        if (q.updated_after) qb.andWhere('r.updatedAt > :ua', { ua: new Date(q.updated_after) });
        const rows = await qb.getMany();
        const more = rows.length > q.limit;
        const page = rows.slice(0, q.limit);
        const ids = page.map((r) => r.id);
        const [exps, skills] = await Promise.all([
            dataSource.getRepository(ResumeExperience).find({ where: { resumeId: In(ids) } }),
            dataSource.getRepository(ResumeSkill).find({ where: { resumeId: In(ids) } }),
        ]);
        const items = page.map((r) => ({
            resume_id: r.id, user_id: r.userId, industry_id: r.industryId, salary_exp_from: r.salaryExpFrom, salary_exp_to: r.salaryExpTo, is_published: true,
            experience_periods: exps.filter((e) => e.resumeId === r.id).map((e) => ({ start_date: e.startDate, end_date: e.endDate ?? null })),
            skill_ids: skills.filter((s) => s.resumeId === r.id).map((s) => s.skillId), updated_at: r.updatedAt.toISOString(),
        }));
        return { items, next_cursor: more ? Buffer.from(page[page.length - 1].id).toString('base64url') : null };
    }

    @Post('/lookup')
    async lookup(@Body({ type: LookupDto }) body: LookupDto) {
        const ids = Array.from(new Set(body.ids));
        const list = await dataSource.getRepository(Resume).find({ where: { id: In(ids) } });
        const found = new Set(list.map((r) => r.id));
        return { items: await assemble(list, body.view === 'detail'), missing_ids: ids.filter((i) => !found.has(i)) };
    }

    @Get('/:resumeId')
    async get(@Param('resumeId') resumeId: string, @QueryParams({ type: ViewQuery }) q: ViewQuery) {
        const r = isUuid(resumeId) ? await dataSource.getRepository(Resume).findOneBy({ id: resumeId }) : null;
        if (!r) throw fail('RESUME_NOT_FOUND');
        return (await assemble([r], q.view === 'detail'))[0];
    }
}
export default InternalController;
