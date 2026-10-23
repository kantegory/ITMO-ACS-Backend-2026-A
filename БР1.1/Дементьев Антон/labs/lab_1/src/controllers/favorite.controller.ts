import {
    Body,
    Delete,
    Get,
    JsonController,
    Param,
    Post,
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
import { PageQuery, pageOptions, paginate } from '../common/pagination';
import { isUniqueViolation, uuidParam } from '../common/validators';
import { CreateFavoriteDto } from '../dto/favorite.dto';
import authMiddleware, { requireRole, RequestWithUser } from '../middlewares/auth.middleware';
import { Role } from '../models/enums';
import { FavoriteVacancy } from '../models/favorite-vacancy.entity';
import { Vacancy } from '../models/vacancy.entity';
import { vacancyShortView } from '../views/vacancy.view';

const AUTH = { security: [{ bearerAuth: [] }] };
const JOBSEEKER = [authMiddleware, requireRole(Role.JOBSEEKER)];

@JsonController('/favorites')
class FavoriteController {
    private favorites = () => dataSource.getRepository(FavoriteVacancy);

    @Get('')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Избранные вакансии', ...AUTH })
    async list(@Req() req: RequestWithUser, @QueryParams({ type: PageQuery }) query: PageQuery) {
        const [list, total] = await this.favorites().findAndCount({
            where: { userId: req.user!.id },
            relations: { vacancy: { company: true, industry: true } },
            order: { createdAt: 'DESC' },
            ...pageOptions(query),
        });
        const items = list.map((f) => ({
            vacancy: vacancyShortView(f.vacancy),
            added_at: f.createdAt,
        }));
        return paginate(items, query.page, query.size, total);
    }

    @Post('')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Добавление в избранное', ...AUTH })
    async add(@Req() req: RequestWithUser, @Body({ type: CreateFavoriteDto }) body: CreateFavoriteDto, @Res() res: Response) {
        const vacancy = await dataSource.getRepository(Vacancy).findOneBy({ id: body.vacancy_id });
        // закрытые вакансии для соискателя «не существуют»
        if (!vacancy || !vacancy.isActive) throw invalid('vacancy_id', 'Вакансия не найдена');

        if (await this.favorites().existsBy({ userId: req.user!.id, vacancyId: vacancy.id })) {
            throw fail('FAVORITE_ALREADY_EXISTS');
        }
        try {
            const saved = await this.favorites().save(
                this.favorites().create({ userId: req.user!.id, vacancyId: vacancy.id }),
            );
            return created(res, '/favorites', {
                vacancy_id: saved.vacancyId,
                created_at: saved.createdAt,
            });
        } catch (error) {
            if (isUniqueViolation(error)) throw fail('FAVORITE_ALREADY_EXISTS');
            throw error;
        }
    }

    @Delete('/:vacancyId')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Удаление из избранного', ...AUTH })
    async remove(@Req() req: RequestWithUser, @Param('vacancyId') vacancyId: string, @Res() res: Response) {
        const favorite = await this.favorites().findOneBy({
            userId: req.user!.id,
            vacancyId: uuidParam(vacancyId, 'FAVORITE_NOT_FOUND'),
        });
        if (!favorite) throw fail('FAVORITE_NOT_FOUND');
        await this.favorites().delete(favorite.id);
        return noContent(res);
    }
}

export default FavoriteController;
