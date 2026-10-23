import { Body, Get, JsonController, QueryParams, Res, UseBefore, Post } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Response } from 'express';
import { ILike } from 'typeorm';

import dataSource from '../config/data-source';
import { fail } from '../common/errors';
import { created } from '../common/http';
import { pageOptions, paginate } from '../common/pagination';
import { escapeLike, isUniqueViolation } from '../common/validators';
import { CreateSkillDto, SkillsQuery } from '../dto/reference.dto';
import authMiddleware from '../middlewares/auth.middleware';
import { Industry } from '../models/industry.entity';
import { Skill } from '../models/skill.entity';
import { industryView, skillView } from '../views/common.view';

const AUTH = { security: [{ bearerAuth: [] }] };

@JsonController()
class ReferenceController {
    @Get('/industries')
    @OpenAPI({ summary: 'Список отраслей' })
    async industries() {
        const list = await dataSource
            .getRepository(Industry)
            .find({ where: { isPublished: true }, order: { title: 'ASC' } });
        return { items: list.map(industryView) };
    }

    @Get('/skills')
    @OpenAPI({ summary: 'Поиск навыков' })
    async skills(@QueryParams({ type: SkillsQuery }) query: SkillsQuery) {
        const [list, total] = await dataSource.getRepository(Skill).findAndCount({
            where: query.query ? { name: ILike(`%${escapeLike(query.query)}%`) } : {},
            order: { name: 'ASC' },
            ...pageOptions(query),
        });
        return paginate(list.map(skillView), query.page, query.size, total);
    }

    @Post('/skills')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Добавление навыка', ...AUTH })
    async createSkill(@Body({ type: CreateSkillDto }) body: CreateSkillDto, @Res() res: Response) {
        const repo = dataSource.getRepository(Skill);
        // повтор без учёта регистра: «python» и «Python» — один навык
        if (await repo.existsBy({ name: ILike(escapeLike(body.name)) })) {
            throw fail('SKILL_ALREADY_EXISTS');
        }
        try {
            const skill = await repo.save(repo.create({ name: body.name }));
            return created(res, `/skills?query=${encodeURIComponent(skill.name)}`, skillView(skill));
        } catch (error) {
            if (isUniqueViolation(error)) throw fail('SKILL_ALREADY_EXISTS');
            throw error;
        }
    }
}

export default ReferenceController;
