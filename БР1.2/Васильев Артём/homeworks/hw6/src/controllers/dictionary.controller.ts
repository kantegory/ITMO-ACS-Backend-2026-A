import { Get } from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';
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

    @Get('/experience-levels')
    async listExperienceLevels() {
        const items = await this.experienceLevelRepository.find({
            where: { isPublished: true },
            order: { minExperienceMonths: 'ASC' },
        });

        return { items };
    }
}

export default DictionaryController;
