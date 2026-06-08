import {
    JsonController,
    Get,
    Post,
    Body,
    UseBefore,
    HttpCode,
    HttpError,
} from 'routing-controllers';
import dataSource from '../config/data-source';
import { DishType } from '../models/dish-type.entity';
import { Ingredient } from '../models/ingredient.entity';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';
import { CreateDictionaryDto } from '../dto/create-dictionary.dto';

@JsonController()
export class DictionaryController {
    private dishRepo = dataSource.getRepository(DishType);
    private ingRepo = dataSource.getRepository(Ingredient);

    @Get('/dish-types')
    async getDishTypes() {
        return await this.dishRepo.find();
    }

    @Post('/dish-types')
    @HttpCode(201)
    @UseBefore(authMiddleware, roleMiddleware(['admin', 'moderator']))
    async createDishType(@Body() body: CreateDictionaryDto) {
        const existing = await this.dishRepo.findOneBy({ name: body.name });
        if (existing)
            throw new HttpError(400, 'Такая категория уже существует');

        const item = this.dishRepo.create({ name: body.name });
        return await this.dishRepo.save(item);
    }

    @Get('/ingredients')
    async getIngredients() {
        return await this.ingRepo.find();
    }

    @Post('/ingredients')
    @HttpCode(201)
    @UseBefore(authMiddleware, roleMiddleware(['admin', 'moderator']))
    async createIngredient(@Body() body: CreateDictionaryDto) {
        const existing = await this.ingRepo.findOneBy({ name: body.name });
        if (existing)
            throw new HttpError(400, 'Такой ингредиент уже существует');

        const item = this.ingRepo.create({ name: body.name });
        return await this.ingRepo.save(item);
    }
}
