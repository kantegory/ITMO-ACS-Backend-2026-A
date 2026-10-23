import { Body, Get, JsonController, Post, QueryParams, Res, UseBefore } from 'routing-controllers';
import { Response } from 'express';
import { ILike, In } from 'typeorm';
import { created, escapeLike, fail, IdsDto, isUniqueViolation, pageOptions, paginate } from '@jobsearch/common';

import { dataSource } from '../db';
import { CreateSkillDto, SkillsQuery } from '../dto/reference.dto';
import { authMiddleware } from '../auth';
import { Industry } from '../models/industry.entity';
import { Skill } from '../models/skill.entity';
import { industryView, skillView } from '../views/common.view';

@JsonController()
class ReferenceController {
    @Get('/api/v1/industries')
    async industries() {
        const list = await dataSource.getRepository(Industry).find({ where: { isPublished: true }, order: { title: 'ASC' } });
        return { items: list.map(industryView) };
    }

    @Get('/api/v1/skills')
    async skills(@QueryParams({ type: SkillsQuery }) query: SkillsQuery) {
        const [list, total] = await dataSource.getRepository(Skill).findAndCount({
            where: query.query ? { name: ILike(`%${escapeLike(query.query)}%`) } : {},
            order: { name: 'ASC' }, ...pageOptions(query),
        });
        return paginate(list.map(skillView), query.page, query.size, total);
    }

    @Post('/api/v1/skills')
    @UseBefore(authMiddleware)
    async createSkill(@Body({ type: CreateSkillDto }) body: CreateSkillDto, @Res() res: Response) {
        const repo = dataSource.getRepository(Skill);
        if (await repo.existsBy({ name: ILike(escapeLike(body.name)) })) throw fail('SKILL_ALREADY_EXISTS');
        try {
            const skill = await repo.save(repo.create({ name: body.name }));
            return created(res, `/skills?query=${encodeURIComponent(skill.name)}`, skillView(skill));
        } catch (error) {
            if (isUniqueViolation(error)) throw fail('SKILL_ALREADY_EXISTS');
            throw error;
        }
    }

    // ---- внутреннее API (пакетные запросы для Vacancy и Resume)
    @Post('/internal/v1/industries/lookup')
    async lookupIndustries(@Body({ type: IdsDto }) body: IdsDto) {
        const ids = Array.from(new Set(body.ids));
        const list = await dataSource.getRepository(Industry).find({ where: { id: In(ids) } });
        const found = new Set(list.map((i) => i.id));
        return { items: list.map((i) => ({ id: i.id, title: i.title, is_published: i.isPublished })), missing_ids: ids.filter((i) => !found.has(i)) };
    }

    @Post('/internal/v1/skills/lookup')
    async lookupSkills(@Body({ type: IdsDto }) body: IdsDto) {
        const ids = Array.from(new Set(body.ids));
        const list = await dataSource.getRepository(Skill).find({ where: { id: In(ids) } });
        const found = new Set(list.map((s) => s.id));
        return { items: list.map(skillView), missing_ids: ids.filter((i) => !found.has(i)) };
    }
}
export default ReferenceController;
