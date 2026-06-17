import { Get, Param, HttpError } from 'routing-controllers';
import { PublicOpenAPI } from '../common/auth-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Specialization } from '../models/specialization.entity';

@EntityController({
    baseRoute: '/specializations',
    entity: Specialization,
})
class SpecializationController extends BaseController {
    @Get('/internal/:id')
    async getInternalById(@Param('id') id: number) {
        const specialization = await this.repository.findOneBy({
            specialization_id: id,
        });

        if (!specialization) {
            throw new HttpError(404, 'Specialization not found');
        }

        return specialization;
    }

    @Get('')
    @PublicOpenAPI('Получить список специализаций', ['references'])
    async getAll() {
        return await this.repository.find({
            relations: ['industry'],
        });
    }

    @Get('/:id/industry')
    @PublicOpenAPI('Получить отрасль специализации', ['references'])
    async getIndustryBySpecializationId(@Param('id') id: number) {
        const specialization = await this.repository.findOne({
            where: {
                specialization_id: id,
            },
            relations: ['industry'],
        });

        if (!specialization) {
            throw new HttpError(404, 'Specialization not found');
        }

        return specialization.industry;
    }
}

export default SpecializationController;
