import { Get, JsonController, QueryParams, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import dataSource from '../config/data-source';
import {
    CategoryDto,
    DifficultyLevelDto,
    ErrorResponseDto,
    IngredientListQueryDto,
    PaginatedIngredientListDto,
} from '../dto/api.dto';
import authMiddleware from '../middlewares/auth.middleware';
import { DifficultyLevel, Ingredient, RecipeCategory } from '../models';

@JsonController('/reference-data')
@UseBefore(authMiddleware)
export default class ReferenceDataController {
    private categoryRepository = dataSource.getRepository(RecipeCategory);

    private difficultyRepository = dataSource.getRepository(DifficultyLevel);

    private ingredientRepository = dataSource.getRepository(Ingredient);

    @Get('/categories')
    @OpenAPI({
        summary: 'Получить список категорий рецептов',
        tags: ['Reference Data'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(CategoryDto, { statusCode: 200, isArray: true })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    async getCategories(): Promise<CategoryDto[]> {
        const categories = await this.categoryRepository.find({
            order: {
                id: 'ASC',
            },
        });

        return categories.map((category) => ({
            id: category.id,
            name: category.name,
        }));
    }

    @Get('/difficulty-levels')
    @OpenAPI({
        summary: 'Получить список уровней сложности',
        tags: ['Reference Data'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(DifficultyLevelDto, { statusCode: 200, isArray: true })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    async getDifficultyLevels(): Promise<DifficultyLevelDto[]> {
        const levels = await this.difficultyRepository.find({
            order: {
                id: 'ASC',
            },
        });

        return levels.map((level) => ({
            id: level.id,
            name: level.name,
        }));
    }

    @Get('/ingredients')
    @OpenAPI({
        summary: 'Получить список ингредиентов',
        tags: ['Reference Data'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(PaginatedIngredientListDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    async getIngredients(
        @QueryParams({ validate: true, type: IngredientListQueryDto })
        query: IngredientListQueryDto,
    ): Promise<PaginatedIngredientListDto> {
        const page = query.page || 1;
        const size = query.size || 10;

        const queryBuilder = this.ingredientRepository
            .createQueryBuilder('ingredient')
            .orderBy('ingredient.name', 'ASC');

        if (query.q) {
            queryBuilder.andWhere('ingredient.name ILIKE :q', {
                q: `%${query.q}%`,
            });
        }

        const [ingredients, totalItems] = await queryBuilder
            .skip((page - 1) * size)
            .take(size)
            .getManyAndCount();

        return {
            items: ingredients.map((ingredient) => ({
                id: ingredient.id,
                name: ingredient.name,
            })),
            page,
            size,
            totalItems,
            totalPages: Math.ceil(totalItems / size),
        };
    }
}
