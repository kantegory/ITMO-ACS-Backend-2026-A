import {
    Delete,
    Get,
    HttpCode,
    OnUndefined,
    Param,
    Post,
    QueryParams,
    Req,
    UseBefore,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { resolvePagination, buildPageMeta } from '../common/pagination';
import {
    ensureConflict,
    ensureForbidden,
    ensureFound,
} from '../common/http-errors';
import { FavoriteVacancy } from '../models/favorite-vacancy.entity';
import { Vacancy } from '../models/vacancy.entity';
import { UserRole } from '../models/enums/user-role.enum';
import { FavoriteListQueryDto } from '../dto/favorite.dto';

@EntityController({
    baseRoute: '/favorites',
    entity: FavoriteVacancy,
})
class FavoriteController extends BaseController {
    private vacancyRepository = dataSource.getRepository(Vacancy);

    @Get('')
    @UseBefore(authMiddleware)
    async list(
        @Req() request: RequestWithUser,
        @QueryParams({ type: FavoriteListQueryDto })
        query: FavoriteListQueryDto,
    ) {
        const { page, limit, skip } = resolvePagination(query);
        const [items, total] = await this.repository.findAndCount({
            where:
                request.user.role === UserRole.ADMIN
                    ? {}
                    : { userId: request.user.id },
            relations: ['vacancy'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip,
        });

        return {
            items,
            meta: buildPageMeta(page, limit, total),
        };
    }

    @Post('/:vacancy_id')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async create(
        @Param('vacancy_id') vacancyId: string,
        @Req() request: RequestWithUser,
    ) {
        ensureForbidden(
            request.user.role === UserRole.APPLICANT ||
                request.user.role === UserRole.ADMIN,
            'Only applicant or admin can manage favorites',
        );

        const vacancy = ensureFound(
            await this.vacancyRepository.findOneBy({ id: vacancyId }),
            'Vacancy not found',
        ) as Vacancy;

        ensureForbidden(vacancy.isPublished, 'Vacancy is not published');

        const existingFavorite = await this.repository.findOneBy({
            userId: request.user.id,
            vacancyId,
        });

        ensureConflict(!existingFavorite, 'Vacancy already added to favorites');

        return await this.repository.save(
            this.repository.create({
                userId: request.user.id,
                vacancyId,
            }),
        );
    }

    @Delete('/:vacancy_id')
    @HttpCode(204)
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    async remove(
        @Param('vacancy_id') vacancyId: string,
        @Req() request: RequestWithUser,
    ) {
        const favorite = await this.repository.findOneBy({
            userId: request.user.id,
            vacancyId,
        });

        ensureFound(favorite, 'Favorite vacancy not found');

        await this.repository.delete({
            userId: request.user.id,
            vacancyId,
        });
    }
}

export default FavoriteController;
