import { Get, Param, UseBefore } from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';
import internalAuthMiddleware from '../middlewares/internal-auth.middleware';
import { ensureFound } from '../common/http-errors';
import { Industry } from '../models/industry.entity';
import { ExperienceLevel } from '../models/experience-level.entity';

@EntityController({
    baseRoute: '/internal/v1',
    entity: Industry,
})
class InternalDictionaryController extends BaseController {
    private experienceLevelRepository =
        dataSource.getRepository(ExperienceLevel);

    @Get('/industries/:industry_id')
    @UseBefore(internalAuthMiddleware)
    async getIndustry(@Param('industry_id') industryId: string) {
        return ensureFound(
            await this.repository.findOneBy({ id: industryId }),
            'Industry not found',
        );
    }

    @Get('/experience-levels/:experience_level_id')
    @UseBefore(internalAuthMiddleware)
    async getExperienceLevel(
        @Param('experience_level_id') experienceLevelId: string,
    ) {
        return ensureFound(
            await this.experienceLevelRepository.findOneBy({
                id: experienceLevelId,
            }),
            'Experience level not found',
        );
    }
}

export default InternalDictionaryController;
