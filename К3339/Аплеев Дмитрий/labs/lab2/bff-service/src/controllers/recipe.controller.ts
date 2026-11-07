import {
    JsonController,
    Body,
    Get,
    Post,
    Patch,
    Delete,
    Req,
    Res,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEnum,
    IsInt,
    Min,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Request, Response } from 'express';

import SETTINGS from '../config/settings';
import { callService, sendResult } from '../utils/call-service';
import { addAuthorsAndLikes, addAuthorAndLikes } from '../utils/collect-data';

enum DishType {
    SOUP = 'SOUP',
    SALAD = 'SALAD',
    MAIN = 'MAIN',
    DESSERT = 'DESSERT',
    DRINK = 'DRINK',
}

enum Difficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
}

class IngredientDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    amount: string;
}

class CreateRecipeDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(DishType)
    dish_type: DishType;

    @IsEnum(Difficulty)
    difficulty: Difficulty;

    @IsInt()
    @Min(1)
    cooking_time: number;

    @IsArray()
    @IsString({ each: true })
    steps: string[];

    @IsOptional()
    @IsString()
    image_url?: string;

    @IsOptional()
    @IsString()
    video_url?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IngredientDto)
    ingredients: IngredientDto[];
}

class UpdateRecipeDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(DishType)
    dish_type?: DishType;

    @IsOptional()
    @IsEnum(Difficulty)
    difficulty?: Difficulty;

    @IsOptional()
    @IsInt()
    @Min(1)
    cooking_time?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    steps?: string[];

    @IsOptional()
    @IsString()
    image_url?: string;

    @IsOptional()
    @IsString()
    video_url?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IngredientDto)
    ingredients?: IngredientDto[];
}

@JsonController('/v1/recipes')
class RecipeController {
    @Get('')
    @OpenAPI({
        summary: 'Поиск рецептов с фильтрацией',
        parameters: [
            {
                name: 'dish_type',
                in: 'query',
                schema: { type: 'string', enum: Object.values(DishType) },
            },
            {
                name: 'difficulty',
                in: 'query',
                schema: { type: 'string', enum: Object.values(Difficulty) },
            },
            { name: 'ingredient', in: 'query', schema: { type: 'string' } },
            { name: 'author_id', in: 'query', schema: { type: 'integer' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
    })
    async getAll(@Req() request: Request, @Res() response: Response) {
        const queryString = request.originalUrl.split('?')[1] || '';

        const result = await callService(
            'GET',
            `${SETTINGS.RECIPE_SERVICE_URL}/v1/recipes?${queryString}`,
        );
        if (result.status !== 200) {
            return sendResult(response, result);
        }

        const items = await addAuthorsAndLikes(result.data.items);

        return response.json({
            items,
            total: result.data.total,
            page: result.data.page,
            limit: result.data.limit,
        });
    }

    @Post('')
    @OpenAPI({ summary: 'Создать рецепт', security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: Request,
        @Res() response: Response,
        @Body({ type: CreateRecipeDto }) recipeData: CreateRecipeDto,
    ) {
        const result = await callService(
            'POST',
            `${SETTINGS.RECIPE_SERVICE_URL}/v1/recipes`,
            request,
            recipeData,
        );
        if (result.status !== 201) {
            return sendResult(response, result);
        }

        return response.status(201).json(await addAuthorAndLikes(result.data));
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Страница рецепта' })
    async getOne(@Req() request: Request, @Res() response: Response) {
        const result = await callService(
            'GET',
            `${SETTINGS.RECIPE_SERVICE_URL}/v1/recipes/${request.params.id}`,
        );
        if (result.status !== 200) {
            return sendResult(response, result);
        }

        return response.json(await addAuthorAndLikes(result.data));
    }

    @Patch('/:id')
    @OpenAPI({
        summary: 'Изменить рецепт (автор или админ)',
        security: [{ bearerAuth: [] }],
    })
    async update(
        @Req() request: Request,
        @Res() response: Response,
        @Body({ type: UpdateRecipeDto }) updateData: UpdateRecipeDto,
    ) {
        const result = await callService(
            'PATCH',
            `${SETTINGS.RECIPE_SERVICE_URL}/v1/recipes/${request.params.id}`,
            request,
            updateData,
        );
        if (result.status !== 200) {
            return sendResult(response, result);
        }

        return response.json(await addAuthorAndLikes(result.data));
    }

    @Delete('/:id')
    @OpenAPI({
        summary: 'Удалить рецепт (автор или админ)',
        security: [{ bearerAuth: [] }],
    })
    async remove(@Req() request: Request, @Res() response: Response) {
        const result = await callService(
            'DELETE',
            `${SETTINGS.RECIPE_SERVICE_URL}/v1/recipes/${request.params.id}`,
            request,
        );

        return sendResult(response, result);
    }
}

export default RecipeController;
