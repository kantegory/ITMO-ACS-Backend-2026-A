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
import SETTINGS from '../config/settings';
import { resolvePagination, buildPageMeta } from '../common/pagination';
import {
    ensureConflict,
    ensureForbidden,
    ensureFound,
} from '../common/http-errors';
import { serviceBatchGet } from '../common/service-client';
import { FavoriteVacancy } from '../models/favorite-vacancy.entity';
import { UserRole } from '../models/enums/user-role.enum';
import { FavoriteListQueryDto } from '../dto/favorite.dto';

@EntityController({
    baseRoute: '/favorites',
    entity: FavoriteVacancy,
})
class FavoriteController extends BaseController {
    private async assertVacancyPublished(vacancyId: string) {
        const vacancies = await serviceBatchGet<{
            id: string;
            isPublished: boolean;
        }>(
            SETTINGS.VACANCY_SERVICE_URL,
            '/internal/v1/vacancies/batch',
            [vacancyId],
        );
        const vacancy = ensureFound(
            vacancies.items.find((item) => item.id === vacancyId),
            'Vacancy not found',
        );

        ensureForbidden(vacancy.isPublished, 'Vacancy is not published');
    }

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
        await this.assertVacancyPublished(vacancyId);

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
