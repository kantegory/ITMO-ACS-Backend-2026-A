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
import { DishType } from '../models/dish-type.entity';

class DishTypeCreateDto {
    @IsString()
    @Type(() => String)
    name: string;
}

class DishTypeUpdateDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    name?: string;
}

@EntityController({
    baseRoute: '/dish-types',
    entity: DishType,
})
class DishTypeController extends BaseController {
    @Get('/')
    @OpenAPI({ summary: 'Get dish types list' })
    async getAll() {
        return this.repository.find();
    }

    @Get('/details')
    @OpenAPI({ summary: 'Get dish type by id' })
    async getById(@QueryParam('id', { required: true, type: Number }) id: number) {
        const dishType = await this.repository.findOneBy({ id });

        if (!dishType) {
            return { message: 'Dish type is not found' };
        }

        return dishType;
    }

    @Post('/')
    @OpenAPI({ summary: 'Create dish type' })
    async create(@Body({ type: DishTypeCreateDto }) data: DishTypeCreateDto) {
        const dishType = this.repository.create(data);
        return this.repository.save(dishType);
    }

    @Patch('/update')
    @OpenAPI({ summary: 'Update dish type' })
    async update(
        @QueryParam('id', { required: true, type: Number }) id: number,
        @Body({ type: DishTypeUpdateDto }) data: DishTypeUpdateDto,
    ) {
        const dishType = await this.repository.findOneBy({ id });

        if (!dishType) {
            return { message: 'Dish type is not found' };
        }

        this.repository.merge(dishType, data);
        return this.repository.save(dishType);
    }

    @Delete('/delete')
    @OpenAPI({ summary: 'Delete dish type' })
    async delete(@QueryParam('id', { required: true, type: Number }) id: number) {
        const dishType = await this.repository.findOneBy({ id });

        if (!dishType) {
            return { message: 'Dish type is not found' };
        }

        await this.repository.remove(dishType);
        return { message: 'Dish type deleted' };
    }
}

export default DishTypeController;
