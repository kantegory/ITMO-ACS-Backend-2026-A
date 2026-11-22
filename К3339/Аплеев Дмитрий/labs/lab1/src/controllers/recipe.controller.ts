import {
    Body,
    Get,
    Post,
    Patch,
    Delete,
    UseBefore,
    Req,
    HttpCode,
    OnUndefined,
    BadRequestError,
    ForbiddenError,
    NotFoundError,
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

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { Recipe } from '../models/recipe.entity';
import { Ingredient } from '../models/ingredient.entity';
import { Like } from '../models/like.entity';
import { DishType, Difficulty, Role } from '../models/enums';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';

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

    // проверяем каждый ингредиент в массиве по правилам IngredientDto
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IngredientDto)
    ingredients: IngredientDto[];
}

// то же самое, но все поля необязательные
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

@EntityController({
    baseRoute: '/recipes',
    entity: Recipe,
})
class RecipeController extends BaseController {
    @Get('')
    @OpenAPI({
        summary: 'Поиск рецептов с фильтрацией',
        // параметры читаем из request.query, поэтому для Swagger описываем их вручную
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
    async getAll(@Req() request: RequestWithUser) {
        const { dish_type, difficulty, ingredient, author_id } = request.query;
        const page = Number(request.query.page) || 1;
        const limit = Number(request.query.limit) || 20;

        const query = this.repository
            .createQueryBuilder('recipe')
            .leftJoinAndSelect('recipe.author', 'author')
            .orderBy('recipe.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (dish_type) {
            if (!Object.values(DishType).includes(dish_type as DishType)) {
                throw new BadRequestError('Unknown dish_type');
            }
            query.andWhere('recipe.dish_type = :dish_type', { dish_type });
        }

        if (difficulty) {
            if (!Object.values(Difficulty).includes(difficulty as Difficulty)) {
                throw new BadRequestError('Unknown difficulty');
            }
            query.andWhere('recipe.difficulty = :difficulty', { difficulty });
        }

        if (author_id) {
            query.andWhere('recipe.author_id = :author_id', {
                author_id: Number(author_id),
            });
        }

        // рецепты, в которых есть ингредиент с похожим названием.
        // названия ингредиентов храним в нижнем регистре, поэтому и искомое
        // слово переводим в нижний регистр (ILIKE не работает с русскими буквами,
        // если база создана с локалью C)
        if (ingredient) {
            query.andWhere(
                'recipe.id IN (SELECT recipe_id FROM ingredient WHERE name LIKE :ingredient)',
                { ingredient: `%${String(ingredient).toLowerCase()}%` },
            );
        }

        const [recipes, total] = await query.getManyAndCount();

        const items = [];
        for (const recipe of recipes) {
            const likesCount = await dataSource
                .getRepository(Like)
                .countBy({ recipe_id: recipe.id });

            items.push({
                id: recipe.id,
                title: recipe.title,
                dish_type: recipe.dish_type,
                difficulty: recipe.difficulty,
                cooking_time: recipe.cooking_time,
                image_url: recipe.image_url,
                author: {
                    id: recipe.author.id,
                    username: recipe.author.username,
                },
                likes_count: likesCount,
            });
        }

        return { items, total, page, limit };
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Создать рецепт', security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateRecipeDto }) recipeData: CreateRecipeDto,
    ) {
        const ingredientRepository = dataSource.getRepository(Ingredient);

        const recipe = this.repository.create({
            author_id: request.user.id,
            title: recipeData.title,
            description: recipeData.description,
            dish_type: recipeData.dish_type,
            difficulty: recipeData.difficulty,
            cooking_time: recipeData.cooking_time,
            steps: recipeData.steps,
            image_url: recipeData.image_url,
            video_url: recipeData.video_url,
            // ингредиенты сохранятся вместе с рецептом (cascade в модели Recipe)
            ingredients: recipeData.ingredients.map((ingredient) =>
                ingredientRepository.create({
                    name: ingredient.name.toLowerCase(),
                    amount: ingredient.amount,
                }),
            ),
        });

        const savedRecipe = await this.repository.save(recipe);

        return await this.getFullRecipe(savedRecipe.id);
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Страница рецепта' })
    async getOne(@Req() request: RequestWithUser) {
        const id = Number(request.params.id);

        return await this.getFullRecipe(id);
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Изменить рецепт (автор или админ)',
        security: [{ bearerAuth: [] }],
    })
    async update(
        @Req() request: RequestWithUser,
        @Body({ type: UpdateRecipeDto }) updateData: UpdateRecipeDto,
    ) {
        const id = Number(request.params.id);
        const recipe = await this.repository.findOneBy({ id });

        if (!recipe) {
            throw new NotFoundError('Recipe not found');
        }

        if (
            recipe.author_id !== request.user.id &&
            request.user.role !== Role.ADMIN
        ) {
            throw new ForbiddenError('You can edit only your own recipes');
        }

        // меняем только те поля, которые пришли в запросе
        if (updateData.title !== undefined) recipe.title = updateData.title;
        if (updateData.description !== undefined)
            recipe.description = updateData.description;
        if (updateData.dish_type !== undefined)
            recipe.dish_type = updateData.dish_type;
        if (updateData.difficulty !== undefined)
            recipe.difficulty = updateData.difficulty;
        if (updateData.cooking_time !== undefined)
            recipe.cooking_time = updateData.cooking_time;
        if (updateData.steps !== undefined) recipe.steps = updateData.steps;
        if (updateData.image_url !== undefined)
            recipe.image_url = updateData.image_url;
        if (updateData.video_url !== undefined)
            recipe.video_url = updateData.video_url;

        // если прислали ингредиенты — старые удаляем и сохраняем новые
        if (updateData.ingredients !== undefined) {
            const ingredientRepository = dataSource.getRepository(Ingredient);

            await ingredientRepository.delete({ recipe_id: id });

            recipe.ingredients = updateData.ingredients.map((ingredient) =>
                ingredientRepository.create({
                    name: ingredient.name.toLowerCase(),
                    amount: ingredient.amount,
                }),
            );
        }

        await this.repository.save(recipe);

        return await this.getFullRecipe(id);
    }

    @Delete('/:id')
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Удалить рецепт (автор или админ)',
        security: [{ bearerAuth: [] }],
    })
    async remove(@Req() request: RequestWithUser) {
        const id = Number(request.params.id);
        const recipe = await this.repository.findOneBy({ id });

        if (!recipe) {
            throw new NotFoundError('Recipe not found');
        }

        if (
            recipe.author_id !== request.user.id &&
            request.user.role !== Role.ADMIN
        ) {
            throw new ForbiddenError('You can delete only your own recipes');
        }

        // ингредиенты, комментарии и лайки удалятся сами (ON DELETE CASCADE)
        await this.repository.delete({ id });
    }

    // рецепт целиком: с автором, ингредиентами и количеством лайков
    private async getFullRecipe(id: number) {
        const recipe = await this.repository.findOne({
            where: { id },
            relations: { author: true, ingredients: true },
            order: { ingredients: { id: 'ASC' } },
        });

        if (!recipe) {
            throw new NotFoundError('Recipe not found');
        }

        const likesCount = await dataSource
            .getRepository(Like)
            .countBy({ recipe_id: id });

        return {
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            dish_type: recipe.dish_type,
            difficulty: recipe.difficulty,
            cooking_time: recipe.cooking_time,
            steps: recipe.steps,
            image_url: recipe.image_url,
            video_url: recipe.video_url,
            author: {
                id: recipe.author.id,
                username: recipe.author.username,
            },
            ingredients: recipe.ingredients.map((ingredient) => ({
                name: ingredient.name,
                amount: ingredient.amount,
            })),
            likes_count: likesCount,
            created_at: recipe.created_at,
            updated_at: recipe.updated_at,
        };
    }
}

export default RecipeController;
