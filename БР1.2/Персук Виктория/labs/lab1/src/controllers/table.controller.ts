import {
    Body,
    Delete,
    Param,
    Patch,
    Post,
    HttpCode,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Table } from '../models/table.entity';
import authMiddleware from '../middlewares/auth.middleware';

class CreateTableDto {
    @IsNumber()
    @Type(() => Number)
    restaurant_id!: number;

    @IsNumber()
    @Type(() => Number)
    capacity!: number;
}

class UpdateTableDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    capacity?: number;
}

@EntityController({
    baseRoute: '/tables',
    entity: Table,
})
class TableController extends BaseController {
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create a table', security: [{ bearerAuth: [] }] })
    async create(@Body({ type: CreateTableDto }) body: CreateTableDto) {
        const table = this.repository.create(body);
        return await this.repository.save(table);
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Update a table', security: [{ bearerAuth: [] }] })
    async update(
        @Param('id') id: number,
        @Body({ type: UpdateTableDto }) body: UpdateTableDto,
    ) {
        const table = await this.repository.findOneBy({ table_id: id });
        if (!table) {
            return { message: 'Table not found' };
        }
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
