import {
    Body,
    Delete,
    Get,
    JsonController,
    NotFoundError,
    Param,
    Post,
    Put,
    Req,
    UseBefore,
} from 'routing-controllers';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

import dataSource from '../config/data-source';
import { UserRole } from '../enums/role.enum';
import {
    AuthMiddleware,
    RequestWithUser,
    requireRole,
} from '../middlewares/auth.middleware';
import { Category } from '../models/category.entity';
import { successResponse } from '../utils/response';
import { serializeCategory } from '../utils/serializers';

class CreateCategoryDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsBoolean()
    is_published?: boolean;
}

class UpdateCategoryDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsBoolean()
    is_published?: boolean;
}

@JsonController('/categories')
class CategoriesController {
    private categoryRepository = dataSource.getRepository(Category);

    @Get()
    async list() {
        const categories = await this.categoryRepository.find({
            where: { isPublished: true },
            order: { title: 'ASC' },
        });

        return successResponse(categories.map(serializeCategory));
    }

    @Post()
    @UseBefore(AuthMiddleware, requireRole([UserRole.ADMIN]))
    async create(
        @Req() _req: RequestWithUser,
        @Body({ validate: true, type: CreateCategoryDto }) body: CreateCategoryDto,
    ) {
        const category = this.categoryRepository.create({
            title: body.title,
            isPublished: body.is_published ?? true,
        });

        const createdCategory = await this.categoryRepository.save(category);

        return successResponse(serializeCategory(createdCategory));
    }

    @Put('/:id')
    @UseBefore(AuthMiddleware, requireRole([UserRole.ADMIN]))
    async update(
        @Param('id') id: number,
        @Body({ validate: true, type: UpdateCategoryDto }) body: UpdateCategoryDto,
    ) {
        const category = await this.categoryRepository.findOneBy({ id: Number(id) });

        if (!category) {
            throw new NotFoundError('Category not found');
        }

        if (body.title !== undefined) {
            category.title = body.title;
        }

        if (body.is_published !== undefined) {
            category.isPublished = body.is_published;
        }

        const updatedCategory = await this.categoryRepository.save(category);

        return successResponse(serializeCategory(updatedCategory));
    }

    @Delete('/:id')
    @UseBefore(AuthMiddleware, requireRole([UserRole.ADMIN]))
    async remove(@Param('id') id: number) {
        const category = await this.categoryRepository.findOneBy({ id: Number(id) });

        if (!category) {
            throw new NotFoundError('Category not found');
        }

        await this.categoryRepository.remove(category);

        return successResponse({}, 'Category deleted');
    }
}

export default CategoriesController;
