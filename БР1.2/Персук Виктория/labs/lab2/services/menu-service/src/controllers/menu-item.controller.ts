import { Body, Delete, Get, Param, Patch, Post, HttpCode, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import axios from 'axios';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { MenuItem } from '../models/menu-item.entity';
import { Menu } from '../models/menu.entity';
import authMiddleware from '../middlewares/auth.middleware';
import { CreateMenuDto, CreateMenuItemDto, UpdateMenuItemDto } from '../dto/menu-item.dto';
import dataSource from '../config/data-source';
import SETTINGS from '../config/settings';

@EntityController({ baseRoute: '/menu-items', entity: MenuItem })
class MenuItemController extends BaseController {
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create a menu item', security: [{ bearerAuth: [] }] })
    async create(@Body({ type: CreateMenuItemDto }) body: CreateMenuItemDto) {
        const item = this.repository.create(body);
        return await this.repository.save(item);
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Update a menu item', security: [{ bearerAuth: [] }] })
    async update(@Param('id') id: number, @Body({ type: UpdateMenuItemDto }) body: UpdateMenuItemDto) {
        const item = await this.repository.findOneBy({ item_id: id });
        if (!item) return { message: 'Menu item not found' };
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

export { MenuItemController };

// Menu CRUD lives here too
import { JsonController } from 'routing-controllers';

@JsonController('/menus')
class MenuController {
    private get menuRepo() {
        return dataSource.getRepository(Menu);
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create a menu', security: [{ bearerAuth: [] }] })
    async createMenu(@Body({ type: CreateMenuDto }) body: CreateMenuDto) {
        try {
            await axios.get(`${SETTINGS.RESTAURANT_SERVICE_URL}/internal/restaurants/${body.restaurant_id}`);
        } catch {
            return { message: 'Restaurant not found' };
        }
        const menu = this.menuRepo.create(body);
        return await this.menuRepo.save(menu);
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Get menu by id' })
    async getMenu(@Param('id') id: number) {
        return await this.menuRepo.findOne({ where: { menu_id: id }, relations: ['menuItems'] });
    }
}

export { MenuController };
export default MenuItemController;
