import { Get, Param } from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';
import { ensureFound } from '../common/http-errors';
import { Industry } from '../models/industry.entity';
import { ExperienceLevel } from '../models/experience-level.entity';

@EntityController({
    baseRoute: '',
    entity: Industry,
})
class DictionaryController extends BaseController {
    private experienceLevelRepository =
        dataSource.getRepository(ExperienceLevel);

    @Get('/industries')
    async listIndustries() {
        const items = await this.repository.find({
            where: { isPublished: true },
            order: { title: 'ASC' },
        });

        return { items };
    }

    @Get('/industries/:industry_id')
    async getIndustry(@Param('industry_id') industryId: string) {
        return ensureFound(
            await this.repository.findOneBy({
                id: industryId,
                isPublished: true,
            }),
            'Industry not found',
        );
    }

    @Get('/experience-levels')
    async listExperienceLevels() {
        const items = await this.experienceLevelRepository.find({
            where: { isPublished: true },
            order: { minExperienceMonths: 'ASC' },
        });

        return { items };
    }

    @Get('/experience-levels/:experience_level_id')
    async getExperienceLevel(
        @Param('experience_level_id') experienceLevelId: string,
    ) {
        return ensureFound(
            await this.experienceLevelRepository.findOneBy({
                id: experienceLevelId,
                isPublished: true,
            }),
            'Experience level not found',
        );
    }
}

export default DictionaryController;
