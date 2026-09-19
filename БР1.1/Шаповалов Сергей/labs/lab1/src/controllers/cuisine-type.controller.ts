import { Get, Param, NotFoundError } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { CuisineType } from '../models/cuisine-type.entity';

@EntityController({
    baseRoute: '/cuisine-types',
    entity: CuisineType,
})
class CuisineTypeController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Список типов кухни', tags: ['Типы кухни'] })
    async getAll() {
        const items = await this.repository.find({ order: { name: 'ASC' } });
        return items.map((item) => ({ id: item.id, name: item.name }));
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Тип кухни', tags: ['Типы кухни'] })
    async getById(@Param('id') id: number) {
        const item = await this.repository.findOneBy({ id });
        if (!item) {
            throw new NotFoundError('Cuisine type not found');
        }
        return { id: item.id, name: item.name };
    }
}

export default CuisineTypeController;
