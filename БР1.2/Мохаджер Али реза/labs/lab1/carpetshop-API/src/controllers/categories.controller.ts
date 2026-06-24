import { BadRequestError, Body, Get, Param, Patch, Post, Delete, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Category } from '../models/category.entity';
import authMiddleware from '../middlewares/auth.middleware';
import requireAdmin from '../middlewares/require-admin.middleware';

class CategoryCreateDto {
    @IsString()
    @Type(() => String)
    title: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsOptional()
    @IsBoolean()
    is_published?: boolean;
}

class CategoryUpdateDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    title?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsOptional()
    @IsBoolean()
    is_published?: boolean;
}

@EntityController({ baseRoute: '/categories', entity: Category })
export default class CategoriesController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Получить список всех категорий' })
    async list() {
        return await this.repository.find({ order: { created_at: 'DESC' } });
    }

    @Post('')
    @UseBefore(authMiddleware, requireAdmin)
    @OpenAPI({ summary: 'Создать категорию (только админ)' })
    async create(@Body({ type: CategoryCreateDto }) dto: CategoryCreateDto) {
        const category = this.repository.create({
            title: dto.title,
            description: dto.description ?? null,
            is_published: dto.is_published ?? true,
        });
        return await this.repository.save(category);
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Получить категорию по ID' })
    async getById(@Param('id') id: number) {
        const category = await this.repository.findOneBy({ id });
        if (!category) throw new BadRequestError('Category not found');
        return category;
    }

    @Patch('/:id')
    @UseBefore(authMiddleware, requireAdmin)
    @OpenAPI({ summary: 'Обновить категорию (только админ)' })
    async update(@Param('id') id: number, @Body({ type: CategoryUpdateDto }) dto: CategoryUpdateDto) {
        const category = await this.repository.findOneBy({ id });
        if (!category) throw new BadRequestError('Category not found');
        Object.assign(category, {
            ...(dto.title !== undefined ? { title: dto.title } : {}),
            ...(dto.description !== undefined ? { description: dto.description } : {}),
            ...(dto.is_published !== undefined ? { is_published: dto.is_published } : {}),
        });
        return await this.repository.save(category);
    }

    @Delete('/:id')
    @UseBefore(authMiddleware, requireAdmin)
    @OpenAPI({ summary: 'Удалить категорию (только админ)' })
    async remove(@Param('id') id: number) {
        const category = await this.repository.findOneBy({ id });
        if (!category) throw new BadRequestError('Category not found');
        await this.repository.remove(category);
        return;
    }
}

