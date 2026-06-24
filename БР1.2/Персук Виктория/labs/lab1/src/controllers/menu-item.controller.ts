import {
    Body,
    Delete,
    Param,
    Patch,
    Post,
    HttpCode,
    UseBefore,
    Req,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { MenuItem } from '../models/menu-item.entity';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';

class CreateMenuItemDto {
    @IsNumber()
    @Type(() => Number)
    menu_id!: number;

    @IsString()
    @Type(() => String)
    name!: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsOptional()
    @Type(() => Number)
    price?: number;
}

class UpdateMenuItemDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsOptional()
    @Type(() => Number)
    price?: number;
}

@EntityController({
    baseRoute: '/menu-items',
    entity: MenuItem,
})
class MenuItemController extends BaseController {
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create a menu item', security: [{ bearerAuth: [] }] })
    async create(
        @Body({ type: CreateMenuItemDto }) body: CreateMenuItemDto,
    ) {
        const item = this.repository.create(body);
        return await this.repository.save(item);
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Update a menu item', security: [{ bearerAuth: [] }] })
    async update(
        @Param('id') id: number,
        @Body({ type: UpdateMenuItemDto }) body: UpdateMenuItemDto,
    ) {
        const item = await this.repository.findOneBy({ item_id: id });
        if (!item) {
            return { message: 'Menu item not found' };
        }
        Object.assign(item, body);
        return await this.repository.save(item);
    }

    @Delete('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Delete a menu item', security: [{ bearerAuth: [] }] })
    async delete(@Param('id') id: number) {
        await this.repository.delete({ item_id: id });
        return { message: 'Menu item deleted' };
    }
}

export default MenuItemController;
