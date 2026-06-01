import { Body, Post, UseBefore } from 'routing-controllers';
import { In } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import internalAuthMiddleware from '../middlewares/internal-auth.middleware';
import { Vacancy } from '../models/vacancy.entity';

@EntityController({
    baseRoute: '/internal/v1/vacancies',
    entity: Vacancy,
})
class InternalVacancyController extends BaseController {
    @Post('/batch')
    @UseBefore(internalAuthMiddleware)
    async getVacanciesBatch(@Body() body: { ids?: string[] }) {
        const ids = [...new Set(body.ids ?? [])];
        const vacancies = ids.length
            ? ((await this.repository.findBy({ id: In(ids) })) as Vacancy[])
            : [];
        const foundIds = new Set(vacancies.map((vacancy) => vacancy.id));

        return {
            items: vacancies,
            missingIds: ids.filter((id) => !foundIds.has(id)),
        };
    }
}

export default InternalVacancyController;
