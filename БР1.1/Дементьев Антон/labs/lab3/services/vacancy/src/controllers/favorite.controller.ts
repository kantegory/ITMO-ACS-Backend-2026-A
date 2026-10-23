import { Body, Delete, Get, JsonController, Param, Post, QueryParams, Req, Res, UseBefore } from 'routing-controllers';
import { Response } from 'express';
import { created, fail, invalid, isUniqueViolation, noContent, PageQuery, pageOptions, paginate, Role, uuidParam } from '@jobsearch/common';

import { dataSource } from '../db';
import { CreateFavoriteDto } from '../dto/favorite.dto';
import { authMiddleware, requireRole, RequestWithUser } from '../auth';
import { FavoriteVacancy } from '../models/favorite-vacancy.entity';
import { Vacancy } from '../models/vacancy.entity';
import { industriesFor, vacancyShortView } from '../support';

const JOBSEEKER = [authMiddleware, requireRole(Role.JOBSEEKER)];

@JsonController('/api/v1/favorites')
class FavoriteController {
    private favorites = () => dataSource.getRepository(FavoriteVacancy);

    @Get('')
    @UseBefore(...JOBSEEKER)
    async list(@Req() req: RequestWithUser, @QueryParams({ type: PageQuery }) query: PageQuery) {
        const [list, total] = await this.favorites().findAndCount({
            where: { userId: req.user!.id }, relations: { vacancy: { company: true } }, order: { createdAt: 'DESC' }, ...pageOptions(query),
        });
        const ind = await industriesFor(list.map((f) => f.vacancy));
        return paginate(list.map((f) => ({ vacancy: vacancyShortView(f.vacancy, ind), added_at: f.createdAt })), query.page, query.size, total);
    }

    @Post('')
    @UseBefore(...JOBSEEKER)
    async add(@Req() req: RequestWithUser, @Body({ type: CreateFavoriteDto }) body: CreateFavoriteDto, @Res() res: Response) {
        const v = await dataSource.getRepository(Vacancy).findOneBy({ id: body.vacancy_id });
        if (!v || !v.isActive) throw invalid('vacancy_id', 'Вакансия не найдена');
        if (await this.favorites().existsBy({ userId: req.user!.id, vacancyId: v.id })) throw fail('FAVORITE_ALREADY_EXISTS');
        try {
            const saved = await this.favorites().save(this.favorites().create({ userId: req.user!.id, vacancyId: v.id }));
            return created(res, '/favorites', { vacancy_id: saved.vacancyId, created_at: saved.createdAt });
        } catch (error) {
            if (isUniqueViolation(error)) throw fail('FAVORITE_ALREADY_EXISTS');
            throw error;
        }
    }

    @Delete('/:vacancyId')
    @UseBefore(...JOBSEEKER)
    async remove(@Req() req: RequestWithUser, @Param('vacancyId') vacancyId: string, @Res() res: Response) {
        const f = await this.favorites().findOneBy({ userId: req.user!.id, vacancyId: uuidParam(vacancyId, 'FAVORITE_NOT_FOUND') });
        if (!f) throw fail('FAVORITE_NOT_FOUND');
        await this.favorites().delete(f.id);
        return noContent(res);
    }
}
export default FavoriteController;
