import { Get, Param, UseBefore } from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';
import internalAuthMiddleware from '../middlewares/internal-auth.middleware';
import { FavoriteVacancy } from '../models/favorite-vacancy.entity';
import { VacancyView } from '../models/vacancy-view.entity';

@EntityController({
    baseRoute: '/internal/v1',
    entity: FavoriteVacancy,
})
class InternalInteractionController extends BaseController {
    private vacancyViewRepository = dataSource.getRepository(VacancyView);

    @Get('/vacancies/:vacancy_id/favorites/count')
    @UseBefore(internalAuthMiddleware)
    async countVacancyFavorites(@Param('vacancy_id') vacancyId: string) {
        return {
            vacancy_id: vacancyId,
            count: await this.repository.countBy({ vacancyId }),
        };
    }

    @Get('/vacancies/:vacancy_id/views/count')
    @UseBefore(internalAuthMiddleware)
    async countVacancyViews(@Param('vacancy_id') vacancyId: string) {
        return {
            vacancy_id: vacancyId,
            count: await this.vacancyViewRepository.countBy({ vacancyId }),
        };
    }

    @Get('/users/:user_id/favorites')
    @UseBefore(internalAuthMiddleware)
    async listUserFavorites(@Param('user_id') userId: string) {
        return {
            items: await this.repository.find({
                where: { userId },
                order: { createdAt: 'DESC' },
            }),
        };
    }
}

export default InternalInteractionController;
