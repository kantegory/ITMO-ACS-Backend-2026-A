import {
    Body,
    Delete,
    Get,
    Patch,
    Post,
    QueryParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Ingredient } from '../models/ingredient.entity';

class IngredientCreateDto {
    @IsString()
    @Type(() => String)
    name: string;
}

class IngredientUpdateDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    name?: string;
}

@EntityController({
    baseRoute: '/ingredients',
    entity: Ingredient,
})
class IngredientController extends BaseController {
    @Get('/')
    @OpenAPI({ summary: 'Get ingredients list' })
    async getAll() {
        return this.repository.find();
    }

    @Get('/details')
    @OpenAPI({ summary: 'Get ingredient by id' })
    async getById(@QueryParam('id', { required: true, type: Number }) id: number) {
        const ingredient = await this.repository.findOneBy({ id });

        if (!ingredient) {
            return { message: 'Ingredient is not found' };
        }

        return ingredient;
    }

    @Post('/')
    @OpenAPI({ summary: 'Create ingredient' })
    async create(@Body({ type: IngredientCreateDto }) data: IngredientCreateDto) {
        const ingredient = this.repository.create(data);
        return this.repository.save(ingredient);
    }

    @Patch('/update')
    @OpenAPI({ summary: 'Update ingredient' })
    async update(
        @QueryParam('id', { required: true, type: Number }) id: number,
        @Body({ type: IngredientUpdateDto }) data: IngredientUpdateDto,
    ) {
        const ingredient = await this.repository.findOneBy({ id });

        if (!ingredient) {
            return { message: 'Ingredient is not found' };
        }

        this.repository.merge(ingredient, data);
        return this.repository.save(ingredient);
    }

    @Delete('/delete')
    @OpenAPI({ summary: 'Delete ingredient' })
    async delete(@QueryParam('id', { required: true, type: Number }) id: number) {
        const ingredient = await this.repository.findOneBy({ id });

        if (!ingredient) {
            return { message: 'Ingredient is not found' };
        }

        await this.repository.remove(ingredient);
        return { message: 'Ingredient deleted' };
    }
}

export default IngredientController;
