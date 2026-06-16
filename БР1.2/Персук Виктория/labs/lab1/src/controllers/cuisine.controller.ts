import { Get } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Cuisine } from '../models/cuisine.entity';

@EntityController({
    baseRoute: '/cuisines',
    entity: Cuisine,
})
class CuisineController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Get all cuisines' })
    async getAll() {
        return await this.repository.find();
    }
}

export default CuisineController;
