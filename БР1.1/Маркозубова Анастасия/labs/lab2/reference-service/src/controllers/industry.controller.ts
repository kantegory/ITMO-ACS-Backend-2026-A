import {
    Get,
    Param,
    HttpError,
} from 'routing-controllers';
import { PublicOpenAPI } from '../common/auth-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Industry } from '../models/industry.entity';

@EntityController({
    baseRoute: '/industries',
    entity: Industry,
})
class IndustryController extends BaseController {
    @Get('')
    @PublicOpenAPI('Получить список отраслей', ['references'])
    async getAll() {
        return await this.repository.find();
    }

    @Get('/:id/specializations')
    @PublicOpenAPI('Получить специализации индустрии', ['references'])
    async getIndustrySpecializations(@Param('id') id: number) {
        const industry = await this.repository.findOne({
            where: {
                industry_id: id,
            },
            relations: ['specializations'],
        });

        if (!industry) {
            throw new HttpError(404, 'Industry not found');
        }

        return industry.specializations;
    }
}

export default IndustryController;
