import {
    Body,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    NotFoundError,
    HttpCode,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { MenuItem } from '../models/menu-item.entity';
import { serializeMenuItem } from '../utils/serializers';

class MenuItemDto {
    @IsOptional()
    @IsInt()
    restaurant?: number;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Number)
    price: number;
}

@EntityController({
    baseRoute: '/menu-items',
    entity: MenuItem,
})
class MenuItemController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Список блюд', tags: ['Меню'] })
    async getAll() {
        const items = await this.repository.find({ order: { name: 'ASC' } });
        return items.map(serializeMenuItem);
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Блюдо', tags: ['Меню'] })
    async getById(@Param('id') id: number) {
        const item = await this.repository.findOneBy({ id });
        if (!item) {
            throw new NotFoundError('Menu item not found');
        }
        return serializeMenuItem(item);
    }

    @Post('')
    @OpenAPI({ summary: 'Создать блюдо', tags: ['Меню'] })
    async create(@Body({ type: MenuItemDto }) data: MenuItemDto) {
        const item = this.repository.create({
            restaurantId: data.restaurant,
            name: data.name,
            description: data.description,
            price: data.price,
        });
        const saved = await this.repository.save(item);
        return serializeMenuItem(saved);
    }

    @Patch('/:id')
    @OpenAPI({ summary: 'Обновить блюдо', tags: ['Меню'] })
    async update(@Param('id') id: number, @Body({ type: MenuItemDto }) data: MenuItemDto) {
        const item = await this.repository.findOneBy({ id });
        if (!item) {
            throw new NotFoundError('Menu item not found');
        }

        if (data.name !== undefined) item.name = data.name;
        if (data.description !== undefined) item.description = data.description;
        if (data.price !== undefined) item.price = data.price;
        if (data.restaurant !== undefined) item.restaurantId = data.restaurant;

        await this.repository.save(item);
        return serializeMenuItem(item);
    }

    @Delete('/:id')
    @HttpCode(204)
    @OpenAPI({ summary: 'Удалить блюдо', tags: ['Меню'] })
    async delete(@Param('id') id: number) {
        const item = await this.repository.findOneBy({ id });
        if (!item) {
            throw new NotFoundError('Menu item not found');
        }
        await this.repository.remove(item);
    }
}

export default MenuItemController;
