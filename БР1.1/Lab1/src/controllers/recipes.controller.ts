import {
    BadRequestError,
    Body,
    Delete,
    ForbiddenError,
    Get,
    HttpCode,
    HttpError,
    JsonController,
    NotFoundError,
    Param,
    Patch,
    Post,
    QueryParams,
    Req,
    UnauthorizedError,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { In } from 'typeorm';

import dataSource from '../config/data-source';
import {
    CommentResponseDto,
    CreateCommentRequestDto,
    CreateRecipeRequestDto,
    ErrorResponseDto,
    PaginatedCommentListDto,
    PaginatedRecipeListDto,
    PaginationQueryDto,
    ReactionResponseDto,
    RecipeListQueryDto,
    RecipeDetailDto,
    UpdateRecipeRequestDto,
    RecipeSortBy,
    SortOrder,
} from '../dto/api.dto';
import { toCommentResponseDto, toRecipeDetailDto, toRecipeSummaryDto } from '../mappers/api.mapper';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import {
    Comment,
    DifficultyLevel,
    Favorite,
    Ingredient,
    Recipe,
    RecipeCategory,
    RecipeIngredient,
    RecipeLike,
    RecipeMedia,
    RecipeStep,
    User,
} from '../models';
import { parseId } from '../utils/parse-id';

type RecipeStatsMap = Map<
    number,
    {
        likesCount: number;
        commentsCount: number;
        isLiked: boolean;
        isFavorite: boolean;
    }
>;

@JsonController('/recipes')
@UseBefore(authMiddleware)
export default class RecipesController {
    private recipeRepository = dataSource.getRepository(Recipe);

    private userRepository = dataSource.getRepository(User);

    private commentRepository = dataSource.getRepository(Comment);

    private likeRepository = dataSource.getRepository(RecipeLike);

    private favoriteRepository = dataSource.getRepository(Favorite);

    private async getCurrentUser(request: RequestWithUser): Promise<User> {
        const user = await this.userRepository.findOneBy({ id: request.user.id });

        if (!user) {
            throw new UnauthorizedError('User from token is not found');
        }

        return user;
    }

    private validateRecipeCollections(
        ingredients?: CreateRecipeRequestDto['ingredients'],
        steps?: CreateRecipeRequestDto['steps'],
        media?: CreateRecipeRequestDto['media'],
    ): void {
        if (ingredients) {
            const ingredientIds = ingredients.map((item) => item.ingredientId);
            const uniqueIngredientIds = new Set(ingredientIds);

            if (uniqueIngredientIds.size !== ingredientIds.length) {
                throw new BadRequestError('Duplicate ingredientId in ingredients list');
            }
        }

        if (steps) {
            const stepNumbers = steps.map((item) => item.stepNumber);
            const uniqueStepNumbers = new Set(stepNumbers);

            if (uniqueStepNumbers.size !== stepNumbers.length) {
                throw new BadRequestError('Duplicate stepNumber in steps list');
            }
        }

        if (media) {
            const sortOrders = media.map((item) => item.sortOrder);
            const uniqueSortOrders = new Set(sortOrders);

            if (uniqueSortOrders.size !== sortOrders.length) {
                throw new BadRequestError('Duplicate sortOrder in media list');
            }
        }
    }

    private async getRecipeOrThrow(recipeId: number): Promise<Recipe> {
        const recipe = await this.recipeRepository
            .createQueryBuilder('recipe')
            .leftJoinAndSelect('recipe.author', 'author')
            .leftJoinAndSelect('recipe.category', 'category')
            .leftJoinAndSelect('recipe.difficulty', 'difficulty')
            .leftJoinAndSelect('recipe.ingredients', 'recipeIngredient')
            .leftJoinAndSelect('recipeIngredient.ingredient', 'ingredient')
            .leftJoinAndSelect('recipe.steps', 'recipeStep')
            .leftJoinAndSelect('recipe.media', 'recipeMedia')
            .where('recipe.recipe_id = :recipeId', { recipeId })
            .orderBy('recipeStep.step_number', 'ASC')
            .addOrderBy('recipeMedia.sort_order', 'ASC')
            .getOne();

        if (!recipe) {
            throw new NotFoundError('Recipe not found');
        }

        return recipe;
    }

    private async getRecipeStatsMap(
        recipeIds: number[],
        currentUserId: number,
    ): Promise<RecipeStatsMap> {
        const statsMap: RecipeStatsMap = new Map();

        if (recipeIds.length === 0) {
            return statsMap;
        }

        const likesCountRows = await this.likeRepository
            .createQueryBuilder('recipeLike')
            .select('recipeLike.recipe_id', 'recipeId')
            .addSelect('COUNT(*)', 'count')
            .where('recipeLike.recipe_id IN (:...recipeIds)', { recipeIds })
            .groupBy('recipeLike.recipe_id')
            .getRawMany<{ recipeId: string; count: string }>();

        const commentsCountRows = await this.commentRepository
            .createQueryBuilder('comment')
            .select('comment.recipe_id', 'recipeId')
            .addSelect('COUNT(*)', 'count')
            .where('comment.recipe_id IN (:...recipeIds)', { recipeIds })
            .groupBy('comment.recipe_id')
            .getRawMany<{ recipeId: string; count: string }>();

        const likedRows = await this.likeRepository
            .createQueryBuilder('recipeLike')
            .select('recipeLike.recipe_id', 'recipeId')
            .where('recipeLike.recipe_id IN (:...recipeIds)', { recipeIds })
            .andWhere('recipeLike.user_id = :userId', { userId: currentUserId })
            .getRawMany<{ recipeId: string }>();

        const favoriteRows = await this.favoriteRepository
            .createQueryBuilder('favorite')
            .select('favorite.recipe_id', 'recipeId')
            .where('favorite.recipe_id IN (:...recipeIds)', { recipeIds })
            .andWhere('favorite.user_id = :userId', { userId: currentUserId })
            .getRawMany<{ recipeId: string }>();

        const likesCountMap = new Map(
            likesCountRows.map((row) => [Number(row.recipeId), Number(row.count)]),
        );
        const commentsCountMap = new Map(
            commentsCountRows.map((row) => [Number(row.recipeId), Number(row.count)]),
        );
        const likedSet = new Set(likedRows.map((row) => Number(row.recipeId)));
        const favoriteSet = new Set(favoriteRows.map((row) => Number(row.recipeId)));

        recipeIds.forEach((recipeId) => {
            statsMap.set(recipeId, {
                likesCount: likesCountMap.get(recipeId) || 0,
                commentsCount: commentsCountMap.get(recipeId) || 0,
                isLiked: likedSet.has(recipeId),
                isFavorite: favoriteSet.has(recipeId),
            });
        });

        return statsMap;
    }

    private async assertRecipeOwner(recipeId: number, currentUserId: number): Promise<Recipe> {
        const recipe = await this.recipeRepository.findOne({
            where: { id: recipeId },
            relations: {
                author: true,
            },
        });

        if (!recipe) {
            throw new NotFoundError('Recipe not found');
        }

        if (recipe.author.id !== currentUserId) {
            throw new ForbiddenError('You are not allowed to update this recipe');
        }

        return recipe;
    }

    @Get('')
    @OpenAPI({
        summary: 'Получить список рецептов с фильтрацией и пагинацией',
        tags: ['Recipes'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(PaginatedRecipeListDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    async getRecipes(
        @Req() request: RequestWithUser,
        @QueryParams({ validate: true, type: RecipeListQueryDto })
        query: RecipeListQueryDto,
    ): Promise<PaginatedRecipeListDto> {
        await this.getCurrentUser(request);

        const page = query.page || 1;
        const size = query.size || 10;

        const queryBuilder = this.recipeRepository
            .createQueryBuilder('recipe')
            .leftJoinAndSelect('recipe.author', 'author')
            .leftJoinAndSelect('recipe.category', 'category')
            .leftJoinAndSelect('recipe.difficulty', 'difficulty')
            .distinct(true);

        if (query.q) {
            queryBuilder.andWhere('(recipe.title ILIKE :q OR recipe.description ILIKE :q)', {
                q: `%${query.q}%`,
            });
        }

        if (query.categoryId) {
            queryBuilder.andWhere('recipe.category_id = :categoryId', {
                categoryId: query.categoryId,
            });
        }

        if (query.difficultyId) {
            queryBuilder.andWhere('recipe.difficulty_id = :difficultyId', {
                difficultyId: query.difficultyId,
            });
        }

        if (query.ingredientId) {
            queryBuilder.innerJoin(
                'recipe.ingredients',
                'ingredientFilter',
                'ingredientFilter.ingredient_id = :ingredientId',
                { ingredientId: query.ingredientId },
            );
        }

        if (query.authorId) {
            queryBuilder.andWhere('recipe.author_id = :authorId', {
                authorId: query.authorId,
            });
        }

        const sortFieldMap: Record<RecipeSortBy, string> = {
            [RecipeSortBy.CREATED_AT]: 'recipe.createdAt',
            [RecipeSortBy.COOKING_TIME_MINUTES]: 'recipe.cookingTimeMinutes',
            [RecipeSortBy.TITLE]: 'recipe.title',
        };

        const sortBy = query.sortBy || RecipeSortBy.CREATED_AT;
        const sortOrder = (query.sortOrder || SortOrder.DESC).toUpperCase() as
            | 'ASC'
            | 'DESC';

        queryBuilder.orderBy(sortFieldMap[sortBy], sortOrder);

        const [recipes, totalItems] = await queryBuilder
            .skip((page - 1) * size)
            .take(size)
            .getManyAndCount();

        const recipeIds = recipes.map((recipe) => recipe.id);
        const statsMap = await this.getRecipeStatsMap(recipeIds, request.user.id);

        return {
            items: recipes.map((recipe) =>
                toRecipeSummaryDto(
                    recipe,
                    statsMap.get(recipe.id) || {
                        likesCount: 0,
                        commentsCount: 0,
                        isLiked: false,
                        isFavorite: false,
                    },
                ),
            ),
            page,
            size,
            totalItems,
            totalPages: Math.ceil(totalItems / size),
        };
    }

    @Post('')
    @HttpCode(201)
    @OpenAPI({
        summary: 'Создать рецепт',
        tags: ['Recipes'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(RecipeDetailDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    async createRecipe(
        @Req() request: RequestWithUser,
        @Body({ validate: true, type: CreateRecipeRequestDto })
        payload: CreateRecipeRequestDto,
    ): Promise<RecipeDetailDto> {
        const currentUser = await this.getCurrentUser(request);
        this.validateRecipeCollections(payload.ingredients, payload.steps, payload.media);

        const createdRecipeId = await dataSource.transaction(async (manager) => {
            const category = await manager.getRepository(RecipeCategory).findOneBy({
                id: payload.categoryId,
            });
            const difficulty = await manager.getRepository(DifficultyLevel).findOneBy({
                id: payload.difficultyId,
            });

            if (!category || !difficulty) {
                throw new BadRequestError('Category or difficulty level not found');
            }

            const ingredientIds = payload.ingredients.map((item) => item.ingredientId);
            const ingredients = await manager
                .getRepository(Ingredient)
                .findBy({ id: In(ingredientIds) });

            if (ingredients.length !== ingredientIds.length) {
                throw new BadRequestError('One or more ingredients are not found');
            }

            const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

            const recipe = manager.getRepository(Recipe).create({
                author: currentUser,
                category,
                difficulty,
                title: payload.title,
                description: payload.description,
                cookingTimeMinutes: payload.cookingTimeMinutes,
                servings: payload.servings,
            });

            const savedRecipe = await manager.getRepository(Recipe).save(recipe);

            const recipeIngredients = payload.ingredients.map((item) => {
                const ingredient = ingredientMap.get(item.ingredientId);

                if (!ingredient) {
                    throw new BadRequestError(
                        `Ingredient with id ${item.ingredientId} not found`,
                    );
                }

                return manager.getRepository(RecipeIngredient).create({
                    recipe: savedRecipe,
                    ingredient,
                    quantity: String(item.quantity),
                    unit: item.unit,
                });
            });

            const recipeSteps = payload.steps.map((item) =>
                manager.getRepository(RecipeStep).create({
                    recipe: savedRecipe,
                    stepNumber: item.stepNumber,
                    description: item.description,
                }),
            );

            const recipeMedia = (payload.media || []).map((item) =>
                manager.getRepository(RecipeMedia).create({
                    recipe: savedRecipe,
                    mediaType: item.mediaType,
                    url: item.url,
                    sortOrder: item.sortOrder,
                }),
            );

            if (recipeIngredients.length > 0) {
                await manager.getRepository(RecipeIngredient).save(recipeIngredients);
            }

            if (recipeSteps.length > 0) {
                await manager.getRepository(RecipeStep).save(recipeSteps);
            }

            if (recipeMedia.length > 0) {
                await manager.getRepository(RecipeMedia).save(recipeMedia);
            }

            return savedRecipe.id;
        });

        const recipe = await this.getRecipeOrThrow(createdRecipeId);
        const statsMap = await this.getRecipeStatsMap([recipe.id], currentUser.id);

        return toRecipeDetailDto(
            recipe,
            statsMap.get(recipe.id) || {
                likesCount: 0,
                commentsCount: 0,
                isLiked: false,
                isFavorite: false,
            },
        );
    }

    @Get('/:recipeId')
    @OpenAPI({
        summary: 'Получить детальную информацию о рецепте',
        tags: ['Recipes'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(RecipeDetailDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async getRecipe(
        @Req() request: RequestWithUser,
        @Param('recipeId') recipeId: number,
    ): Promise<RecipeDetailDto> {
        await this.getCurrentUser(request);

        const normalizedRecipeId = parseId(recipeId, 'recipeId');
        const recipe = await this.getRecipeOrThrow(normalizedRecipeId);
        const statsMap = await this.getRecipeStatsMap([recipe.id], request.user.id);

        return toRecipeDetailDto(
            recipe,
            statsMap.get(recipe.id) || {
                likesCount: 0,
                commentsCount: 0,
                isLiked: false,
                isFavorite: false,
            },
        );
    }

    @Patch('/:recipeId')
    @OpenAPI({
        summary: 'Обновить рецепт',
        tags: ['Recipes'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(RecipeDetailDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 403 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async updateRecipe(
        @Req() request: RequestWithUser,
        @Param('recipeId') recipeId: number,
        @Body({ validate: true, type: UpdateRecipeRequestDto })
        payload: UpdateRecipeRequestDto,
    ): Promise<RecipeDetailDto> {
        const currentUser = await this.getCurrentUser(request);

        if (Object.keys(payload).length === 0) {
            throw new BadRequestError('Nothing to update');
        }

        const normalizedRecipeId = parseId(recipeId, 'recipeId');

        if (payload.ingredients || payload.steps || payload.media) {
            this.validateRecipeCollections(payload.ingredients, payload.steps, payload.media);
        }

        await dataSource.transaction(async (manager) => {
            const recipeRepository = manager.getRepository(Recipe);
            const recipe = await recipeRepository.findOne({
                where: {
                    id: normalizedRecipeId,
                },
                relations: {
                    author: true,
                },
            });

            if (!recipe) {
                throw new NotFoundError('Recipe not found');
            }

            if (recipe.author.id !== currentUser.id) {
                throw new ForbiddenError('You are not allowed to update this recipe');
            }

            if (payload.categoryId !== undefined) {
                const category = await manager.getRepository(RecipeCategory).findOneBy({
                    id: payload.categoryId,
                });

                if (!category) {
                    throw new BadRequestError('Category not found');
                }

                recipe.category = category;
            }

            if (payload.difficultyId !== undefined) {
                const difficulty = await manager.getRepository(DifficultyLevel).findOneBy({
                    id: payload.difficultyId,
                });

                if (!difficulty) {
                    throw new BadRequestError('Difficulty level not found');
                }

                recipe.difficulty = difficulty;
            }

            if (payload.title !== undefined) {
                recipe.title = payload.title;
            }

            if (payload.description !== undefined) {
                recipe.description = payload.description;
            }

            if (payload.cookingTimeMinutes !== undefined) {
                recipe.cookingTimeMinutes = payload.cookingTimeMinutes;
            }

            if (payload.servings !== undefined) {
                recipe.servings = payload.servings;
            }

            await recipeRepository.save(recipe);

            if (payload.ingredients !== undefined) {
                await manager
                    .createQueryBuilder()
                    .delete()
                    .from(RecipeIngredient)
                    .where('recipe_id = :recipeId', { recipeId: recipe.id })
                    .execute();

                if (payload.ingredients.length > 0) {
                    const ingredientIds = payload.ingredients.map(
                        (item) => item.ingredientId,
                    );
                    const ingredients = await manager
                        .getRepository(Ingredient)
                        .findBy({ id: In(ingredientIds) });

                    if (ingredients.length !== ingredientIds.length) {
                        throw new BadRequestError('One or more ingredients are not found');
                    }

                    const ingredientMap = new Map(
                        ingredients.map((ingredient) => [ingredient.id, ingredient]),
                    );

                    const recipeIngredients = payload.ingredients.map((item) => {
                        const ingredient = ingredientMap.get(item.ingredientId);

                        if (!ingredient) {
                            throw new BadRequestError(
                                `Ingredient with id ${item.ingredientId} not found`,
                            );
                        }

                        return manager.getRepository(RecipeIngredient).create({
                            recipe,
                            ingredient,
                            quantity: String(item.quantity),
                            unit: item.unit,
                        });
                    });

                    await manager.getRepository(RecipeIngredient).save(recipeIngredients);
                }
            }

            if (payload.steps !== undefined) {
                await manager
                    .createQueryBuilder()
                    .delete()
                    .from(RecipeStep)
                    .where('recipe_id = :recipeId', { recipeId: recipe.id })
                    .execute();

                if (payload.steps.length > 0) {
                    const recipeSteps = payload.steps.map((item) =>
                        manager.getRepository(RecipeStep).create({
                            recipe,
                            stepNumber: item.stepNumber,
                            description: item.description,
                        }),
                    );

                    await manager.getRepository(RecipeStep).save(recipeSteps);
                }
            }

            if (payload.media !== undefined) {
                await manager
                    .createQueryBuilder()
                    .delete()
                    .from(RecipeMedia)
                    .where('recipe_id = :recipeId', { recipeId: recipe.id })
                    .execute();

                if (payload.media.length > 0) {
                    const recipeMedia = payload.media.map((item) =>
                        manager.getRepository(RecipeMedia).create({
                            recipe,
                            mediaType: item.mediaType,
                            url: item.url,
                            sortOrder: item.sortOrder,
                        }),
                    );

                    await manager.getRepository(RecipeMedia).save(recipeMedia);
                }
            }
        });

        const recipe = await this.getRecipeOrThrow(normalizedRecipeId);
        const statsMap = await this.getRecipeStatsMap([recipe.id], currentUser.id);

        return toRecipeDetailDto(
            recipe,
            statsMap.get(recipe.id) || {
                likesCount: 0,
                commentsCount: 0,
                isLiked: false,
                isFavorite: false,
            },
        );
    }

    @Delete('/:recipeId')
    @HttpCode(204)
    @OpenAPI({
        summary: 'Удалить рецепт',
        tags: ['Recipes'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 403 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async deleteRecipe(
        @Req() request: RequestWithUser,
        @Param('recipeId') recipeId: number,
    ): Promise<void> {
        const currentUser = await this.getCurrentUser(request);
        const normalizedRecipeId = parseId(recipeId, 'recipeId');

        await this.assertRecipeOwner(normalizedRecipeId, currentUser.id);

        await this.recipeRepository.delete({ id: normalizedRecipeId });
    }

    @Get('/:recipeId/comments')
    @OpenAPI({
        summary: 'Получить комментарии к рецепту',
        tags: ['Comments'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(PaginatedCommentListDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async getRecipeComments(
        @Req() request: RequestWithUser,
        @Param('recipeId') recipeId: number,
        @QueryParams({ validate: true, type: PaginationQueryDto })
        query: PaginationQueryDto,
    ): Promise<PaginatedCommentListDto> {
        await this.getCurrentUser(request);

        const normalizedRecipeId = parseId(recipeId, 'recipeId');
        const recipeExists = await this.recipeRepository.findOneBy({
            id: normalizedRecipeId,
        });

        if (!recipeExists) {
            throw new NotFoundError('Recipe not found');
        }

        const page = query.page || 1;
        const size = query.size || 10;

        const [comments, totalItems] = await this.commentRepository
            .createQueryBuilder('comment')
            .leftJoinAndSelect('comment.author', 'author')
            .leftJoinAndSelect('comment.recipe', 'recipe')
            .where('comment.recipe_id = :recipeId', {
                recipeId: normalizedRecipeId,
            })
            .orderBy('comment.createdAt', 'DESC')
            .skip((page - 1) * size)
            .take(size)
            .getManyAndCount();

        return {
            items: comments.map(toCommentResponseDto),
            page,
            size,
            totalItems,
            totalPages: Math.ceil(totalItems / size),
        };
    }

    @Post('/:recipeId/comments')
    @HttpCode(201)
    @OpenAPI({
        summary: 'Добавить комментарий к рецепту',
        tags: ['Comments'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(CommentResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async addComment(
        @Req() request: RequestWithUser,
        @Param('recipeId') recipeId: number,
        @Body({ validate: true, type: CreateCommentRequestDto })
        payload: CreateCommentRequestDto,
    ): Promise<CommentResponseDto> {
        const currentUser = await this.getCurrentUser(request);

        const normalizedRecipeId = parseId(recipeId, 'recipeId');
        const recipe = await this.recipeRepository.findOneBy({
            id: normalizedRecipeId,
        });

        if (!recipe) {
            throw new NotFoundError('Recipe not found');
        }

        const comment = this.commentRepository.create({
            recipe,
            author: currentUser,
            content: payload.content,
        });

        const savedComment = await this.commentRepository.save(comment);

        const createdComment = await this.commentRepository.findOne({
            where: {
                id: savedComment.id,
            },
            relations: {
                recipe: true,
                author: true,
            },
        });

        if (!createdComment) {
            throw new HttpError(500, 'Comment was created but cannot be retrieved');
        }

        return toCommentResponseDto(createdComment);
    }

    @Post('/:recipeId/like')
    @HttpCode(201)
    @OpenAPI({
        summary: 'Поставить лайк рецепту',
        tags: ['Recipes'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(ReactionResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 409 })
    async likeRecipe(
        @Req() request: RequestWithUser,
        @Param('recipeId') recipeId: number,
    ): Promise<ReactionResponseDto> {
        const currentUser = await this.getCurrentUser(request);
        const normalizedRecipeId = parseId(recipeId, 'recipeId');

        const recipe = await this.recipeRepository.findOneBy({
            id: normalizedRecipeId,
        });

        if (!recipe) {
            throw new NotFoundError('Recipe not found');
        }

        const existingLike = await this.likeRepository.findOne({
            where: {
                recipe: { id: normalizedRecipeId },
                user: { id: currentUser.id },
            },
            relations: {
                recipe: true,
                user: true,
            },
        });

        if (existingLike) {
            throw new HttpError(409, 'Like already exists');
        }

        const like = this.likeRepository.create({
            recipe,
            user: currentUser,
        });

        const savedLike = await this.likeRepository.save(like);

        return {
            recipeId: recipe.id,
            userId: currentUser.id,
            createdAt: savedLike.createdAt,
        };
    }

    @Delete('/:recipeId/like')
    @HttpCode(204)
    @OpenAPI({
        summary: 'Удалить лайк у рецепта',
        tags: ['Recipes'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async unlikeRecipe(
        @Req() request: RequestWithUser,
        @Param('recipeId') recipeId: number,
    ): Promise<void> {
        const currentUser = await this.getCurrentUser(request);
        const normalizedRecipeId = parseId(recipeId, 'recipeId');

        const recipeExists = await this.recipeRepository.findOneBy({
            id: normalizedRecipeId,
        });

        if (!recipeExists) {
            throw new NotFoundError('Recipe not found');
        }

        const deleteResult = await this.likeRepository
            .createQueryBuilder()
            .delete()
            .from(RecipeLike)
            .where('recipe_id = :recipeId', { recipeId: normalizedRecipeId })
            .andWhere('user_id = :userId', { userId: currentUser.id })
            .execute();

        if (!deleteResult.affected) {
            throw new NotFoundError('Like not found');
        }
    }

    @Post('/:recipeId/favorite')
    @HttpCode(201)
    @OpenAPI({
        summary: 'Добавить рецепт в избранное',
        tags: ['Favorites'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(ReactionResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 409 })
    async addFavorite(
        @Req() request: RequestWithUser,
        @Param('recipeId') recipeId: number,
    ): Promise<ReactionResponseDto> {
        const currentUser = await this.getCurrentUser(request);
        const normalizedRecipeId = parseId(recipeId, 'recipeId');

        const recipe = await this.recipeRepository.findOneBy({
            id: normalizedRecipeId,
        });

        if (!recipe) {
            throw new NotFoundError('Recipe not found');
        }

        const existingFavorite = await this.favoriteRepository.findOne({
            where: {
                recipe: { id: normalizedRecipeId },
                user: { id: currentUser.id },
            },
            relations: {
                recipe: true,
                user: true,
            },
        });

        if (existingFavorite) {
            throw new HttpError(409, 'Recipe already in favorites');
        }

        const favorite = this.favoriteRepository.create({
            recipe,
            user: currentUser,
        });

        const savedFavorite = await this.favoriteRepository.save(favorite);

        return {
            recipeId: recipe.id,
            userId: currentUser.id,
            createdAt: savedFavorite.createdAt,
        };
    }

    @Delete('/:recipeId/favorite')
    @HttpCode(204)
    @OpenAPI({
        summary: 'Удалить рецепт из избранного',
        tags: ['Favorites'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async removeFavorite(
        @Req() request: RequestWithUser,
        @Param('recipeId') recipeId: number,
    ): Promise<void> {
        const currentUser = await this.getCurrentUser(request);
        const normalizedRecipeId = parseId(recipeId, 'recipeId');

        const recipeExists = await this.recipeRepository.findOneBy({
            id: normalizedRecipeId,
        });

        if (!recipeExists) {
            throw new NotFoundError('Recipe not found');
        }

        const deleteResult = await this.favoriteRepository
            .createQueryBuilder()
            .delete()
            .from(Favorite)
            .where('recipe_id = :recipeId', { recipeId: normalizedRecipeId })
            .andWhere('user_id = :userId', { userId: currentUser.id })
            .execute();

        if (!deleteResult.affected) {
            throw new NotFoundError('Favorite not found');
        }
    }
}
