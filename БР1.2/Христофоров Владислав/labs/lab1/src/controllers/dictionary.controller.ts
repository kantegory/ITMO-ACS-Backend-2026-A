import { JsonController, Get } from 'routing-controllers';
import dataSource from '../config/data-source';
import { DishType } from '../models/dish-type.entity';
import { Ingredient } from '../models/ingredient.entity';

@JsonController('')
export class DictionaryController {
    private dishRepo = dataSource.getRepository(DishType);
    private ingRepo = dataSource.getRepository(Ingredient);

    @Get('/dish-types')
    async getDishTypes() {
        return await this.dishRepo.find();
    }

    @Get('/ingredients')
    async getIngredients() {
        return await this.ingRepo.find();
    }
}
