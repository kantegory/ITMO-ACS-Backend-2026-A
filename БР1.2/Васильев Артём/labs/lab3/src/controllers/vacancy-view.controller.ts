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
import dataSource from '../config/data-source';
import { resolvePagination, buildPageMeta } from '../common/pagination';
import { ensureForbidden, ensureFound } from '../common/http-errors';
import { VacancyView } from '../models/vacancy-view.entity';
import { Vacancy } from '../models/vacancy.entity';
import { VacancyViewListQueryDto } from '../dto/vacancy-view.dto';
import { UserRole } from '../models/enums/user-role.enum';

@EntityController({
    baseRoute: '',
    entity: VacancyView,
})
class VacancyViewController extends BaseController {
    private vacancyRepository = dataSource.getRepository(Vacancy);

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

        const vacancy = ensureFound(
            await this.vacancyRepository.findOneBy({ id: vacancyId }),
            'Vacancy not found',
        ) as Vacancy;

        ensureForbidden(vacancy.isPublished, 'Vacancy is not published');

        return await this.repository.save(
            this.repository.create({
                userId: request.user.id,
                vacancyId,
            }),
        );
    }
}

export default VacancyViewController;
