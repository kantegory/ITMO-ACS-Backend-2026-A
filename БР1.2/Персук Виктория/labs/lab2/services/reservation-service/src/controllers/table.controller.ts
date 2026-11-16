import { Body, Delete, Param, Patch, Post, HttpCode, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import axios from 'axios';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Table } from '../models/table.entity';
import authMiddleware from '../middlewares/auth.middleware';
import { CreateTableDto, UpdateTableDto } from '../dto/table.dto';
import SETTINGS from '../config/settings';

@EntityController({ baseRoute: '/tables', entity: Table })
class TableController extends BaseController {
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create a table', security: [{ bearerAuth: [] }] })
    async create(@Body({ type: CreateTableDto }) body: CreateTableDto) {
        try {
            await axios.get(`${SETTINGS.RESTAURANT_SERVICE_URL}/internal/restaurants/${body.restaurant_id}`);
        } catch {
            return { message: 'Restaurant not found' };
        }

        const table = this.repository.create(body);
        return await this.repository.save(table);
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Update a table', security: [{ bearerAuth: [] }] })
    async update(@Param('id') id: number, @Body({ type: UpdateTableDto }) body: UpdateTableDto) {
        const table = await this.repository.findOneBy({ table_id: id });
        if (!table) return { message: 'Table not found' };
        Object.assign(table, body);
        return await this.repository.save(table);
    }

    @Delete('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Delete a table', security: [{ bearerAuth: [] }] })
    async delete(@Param('id') id: number) {
        await this.repository.delete({ table_id: id });
        return { message: 'Table deleted' };
    }
}

export default TableController;
