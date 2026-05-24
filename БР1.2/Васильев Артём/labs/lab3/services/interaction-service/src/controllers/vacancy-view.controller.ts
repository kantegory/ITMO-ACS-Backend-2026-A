import {
    Get,
    HttpCode,
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
import { ensureForbidden, ensureFound } from '../common/http-errors';
import { serviceBatchGet } from '../common/service-client';
import { VacancyView } from '../models/vacancy-view.entity';
import { VacancyViewListQueryDto } from '../dto/vacancy-view.dto';
import { UserRole } from '../models/enums/user-role.enum';

@EntityController({
    baseRoute: '',
    entity: VacancyView,
})
class VacancyViewController extends BaseController {
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

    @Get('/vacancy-views')
    @UseBefore(authMiddleware)
    async list(
        @Req() request: RequestWithUser,
        @QueryParams({ type: VacancyViewListQueryDto })
        query: VacancyViewListQueryDto,
    ) {
        ensureForbidden(
            request.user.role === UserRole.APPLICANT ||
                request.user.role === UserRole.ADMIN,
            'Only applicant or admin can access vacancy views',
        );

        const { page, limit, skip } = resolvePagination(query);
        const [items, total] = await this.repository.findAndCount({
            where: { userId: request.user.id },
            order: { createdAt: 'DESC' },
            take: limit,
            skip,
        });

        return {
            items,
            meta: buildPageMeta(page, limit, total),
        };
    }

    @Post('/vacancies/:vacancy_id/views')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async create(
        @Param('vacancy_id') vacancyId: string,
        @Req() request: RequestWithUser,
    ) {
        ensureForbidden(
            request.user.role === UserRole.APPLICANT ||
                request.user.role === UserRole.ADMIN,
            'Only applicant or admin can create vacancy views',
        );
        await this.assertVacancyPublished(vacancyId);

        return await this.repository.save(
            this.repository.create({
                userId: request.user.id,
                vacancyId,
            }),
        );
    }
}

export default VacancyViewController;
