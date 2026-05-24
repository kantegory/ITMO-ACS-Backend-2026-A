import 'reflect-metadata';

import cors from 'cors';
import express from 'express';
import { In } from 'typeorm';

import { asyncHandler } from '../shared/async-handler';
import { requireServiceToken, requireUser, RequestWithUser } from '../shared/auth';
import {
    badRequest,
    forbidden,
    notFound,
    notFoundHandler,
    errorHandler,
} from '../shared/errors';
import { serviceRequest } from '../shared/http-client';
import { paginated, parseId, parsePagination } from '../shared/pagination';
import SETTINGS from '../shared/settings';
import { mountInternalSwagger } from '../shared/swagger';
import recipeDataSource from './data-source';
import { DifficultyLevel } from './entities/difficulty-level.entity';
import { Ingredient } from './entities/ingredient.entity';
import { RecipeCategory } from './entities/recipe-category.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeMedia, RecipeMediaType } from './entities/recipe-media.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { Recipe } from './entities/recipe.entity';
import { seedReferenceData } from './seeds/reference-data.seed';

type PublicUser = {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
};

type RecipeStats = {
    recipeId: number;
    commentsCount: number;
    likesCount: number;
    favoritesCount: number;
};

type RecipeUserState = {
    recipeId: number;
    userId: number;
    isLiked: boolean;
    isFavorite: boolean;
};

type RecipeIngredientInput = {
    ingredientId?: unknown;
    quantity?: unknown;
    unit?: unknown;
};

type ValidatedRecipeIngredientInput = {
    ingredientId: number;
    quantity: number;
    unit: string;
};

type RecipeStepInput = {
    stepNumber?: unknown;
    description?: unknown;
};

type ValidatedRecipeStepInput = {
    stepNumber: number;
    description: string;
};

type RecipeMediaInput = {
    mediaType?: unknown;
    url?: unknown;
    sortOrder?: unknown;
};

type ValidatedRecipeMediaInput = {
    mediaType: RecipeMediaType;
    url: string;
    sortOrder: number;
};

type RecipePayload = {
    title?: unknown;
    description?: unknown;
    categoryId?: unknown;
    difficultyId?: unknown;
    cookingTimeMinutes?: unknown;
    servings?: unknown;
    ingredients?: unknown;
    steps?: unknown;
    media?: unknown;
};

const app = express();

app.use(cors());
app.use(express.json());

mountInternalSwagger(app);

const recipeRepository = () => recipeDataSource.getRepository(Recipe);
const categoryRepository = () => recipeDataSource.getRepository(RecipeCategory);
const difficultyRepository = () => recipeDataSource.getRepository(DifficultyLevel);
const ingredientRepository = () => recipeDataSource.getRepository(Ingredient);

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const assertString = (
    value: unknown,
    field: string,
    minLength = 1,
    maxLength = Number.MAX_SAFE_INTEGER,
): string => {
    if (typeof value !== 'string' || value.length < minLength || value.length > maxLength) {
        throw badRequest(`${field} must be a string from ${minLength} to ${maxLength} characters`);
    }

    return value;
};

const assertPositiveInt = (value: unknown, field: string): number => {
    const parsed = Number.parseInt(String(value), 10);

    if (Number.isNaN(parsed) || parsed < 1) {
        throw badRequest(`${field} must be a positive integer`);
    }

    return parsed;
};

const assertPositiveNumber = (value: unknown, field: string): number => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw badRequest(`${field} must be a positive number`);
    }

    return parsed;
};

const validateCreateRecipe = (payload: RecipePayload) => {
    if (!isObject(payload)) {
        throw badRequest('Request body must be an object');
    }

    const ingredients = validateIngredients(payload.ingredients, true);
    const steps = validateSteps(payload.steps, true);
    const media = validateMedia(payload.media, false);

    return {
        title: assertString(payload.title, 'title', 3, 255),
        description: assertString(payload.description, 'description', 1, 5000),
        categoryId: assertPositiveInt(payload.categoryId, 'categoryId'),
        difficultyId: assertPositiveInt(payload.difficultyId, 'difficultyId'),
        cookingTimeMinutes: assertPositiveInt(
            payload.cookingTimeMinutes,
            'cookingTimeMinutes',
        ),
        servings: assertPositiveInt(payload.servings, 'servings'),
        ingredients,
        steps,
        media,
    };
};

const validateUpdateRecipe = (payload: RecipePayload) => {
    if (!isObject(payload) || Object.keys(payload).length === 0) {
        throw badRequest('Nothing to update');
    }

    return {
        title:
            payload.title === undefined
                ? undefined
                : assertString(payload.title, 'title', 3, 255),
        description:
            payload.description === undefined
                ? undefined
                : assertString(payload.description, 'description', 1, 5000),
        categoryId:
            payload.categoryId === undefined
                ? undefined
                : assertPositiveInt(payload.categoryId, 'categoryId'),
        difficultyId:
            payload.difficultyId === undefined
                ? undefined
                : assertPositiveInt(payload.difficultyId, 'difficultyId'),
        cookingTimeMinutes:
            payload.cookingTimeMinutes === undefined
                ? undefined
                : assertPositiveInt(payload.cookingTimeMinutes, 'cookingTimeMinutes'),
        servings:
            payload.servings === undefined
                ? undefined
                : assertPositiveInt(payload.servings, 'servings'),
        ingredients:
            payload.ingredients === undefined
                ? undefined
                : validateIngredients(payload.ingredients, false),
        steps: payload.steps === undefined ? undefined : validateSteps(payload.steps, false),
        media: payload.media === undefined ? undefined : validateMedia(payload.media, false),
    };
};

const validateIngredients = (
    value: unknown,
    required: boolean,
): ValidatedRecipeIngredientInput[] => {
    if (value === undefined && !required) {
        return [];
    }

    if (!Array.isArray(value) || (required && value.length === 0)) {
        throw badRequest('ingredients must be a non-empty array');
    }

    const ingredients = value.map((item, index) => {
        if (!isObject(item)) {
            throw badRequest(`ingredients[${index}] must be an object`);
        }

        return {
            ingredientId: assertPositiveInt(item.ingredientId, `ingredients[${index}].ingredientId`),
            quantity: assertPositiveNumber(item.quantity, `ingredients[${index}].quantity`),
            unit: assertString(item.unit, `ingredients[${index}].unit`, 1, 32),
        };
    });

    assertUnique(ingredients.map((item) => item.ingredientId), 'Duplicate ingredientId');

    return ingredients;
};

const validateSteps = (value: unknown, required: boolean): ValidatedRecipeStepInput[] => {
    if (value === undefined && !required) {
        return [];
    }

    if (!Array.isArray(value) || (required && value.length === 0)) {
        throw badRequest('steps must be a non-empty array');
    }

    const steps = value.map((item, index) => {
        if (!isObject(item)) {
            throw badRequest(`steps[${index}] must be an object`);
        }

        return {
            stepNumber: assertPositiveInt(item.stepNumber, `steps[${index}].stepNumber`),
            description: assertString(item.description, `steps[${index}].description`, 1, 2000),
        };
    });

    assertUnique(steps.map((item) => item.stepNumber), 'Duplicate stepNumber');

    return steps;
};

const validateMedia = (value: unknown, required: boolean): ValidatedRecipeMediaInput[] => {
    if (value === undefined || value === null) {
        if (required) {
            throw badRequest('media must be an array');
        }

        return [];
    }

    if (!Array.isArray(value)) {
        throw badRequest('media must be an array');
    }

    const media = value.map((item, index) => {
        if (!isObject(item)) {
            throw badRequest(`media[${index}] must be an object`);
        }

        const mediaType = assertString(item.mediaType, `media[${index}].mediaType`);

        if (!Object.values(RecipeMediaType).includes(mediaType as RecipeMediaType)) {
            throw badRequest(`media[${index}].mediaType must be image or video`);
        }

        return {
            mediaType: mediaType as RecipeMediaType,
            url: assertString(item.url, `media[${index}].url`, 1, 1024),
            sortOrder: assertPositiveInt(item.sortOrder, `media[${index}].sortOrder`),
        };
    });

    assertUnique(media.map((item) => item.sortOrder), 'Duplicate sortOrder');

    return media;
};

const assertUnique = (values: unknown[], message: string): void => {
    if (new Set(values).size !== values.length) {
        throw badRequest(message);
    }
};

const getPublicUser = async (userId: number): Promise<PublicUser> =>
    serviceRequest<PublicUser>(
        SETTINGS.AUTH_SERVICE_URL,
        `/internal/users/${userId}/public`,
        'recipe-service',
    );

const getStats = async (recipeId: number): Promise<RecipeStats> =>
    serviceRequest<RecipeStats>(
        SETTINGS.INTERACTION_SERVICE_URL,
        `/internal/recipes/${recipeId}/stats`,
        'recipe-service',
    );

const getUserState = async (recipeId: number, userId: number): Promise<RecipeUserState> =>
    serviceRequest<RecipeUserState>(
        SETTINGS.INTERACTION_SERVICE_URL,
        `/internal/recipes/${recipeId}/user-state`,
        'recipe-service',
        {
            query: { userId },
        },
    );

const cleanupInteractions = async (recipeId: number): Promise<void> => {
    await serviceRequest<unknown>(
        SETTINGS.INTERACTION_SERVICE_URL,
        `/internal/recipes/${recipeId}/interactions`,
        'recipe-service',
        {
            method: 'DELETE',
        },
    );
};

const getRecipeOrThrow = async (recipeId: number): Promise<Recipe> => {
    const recipe = await recipeRepository()
        .createQueryBuilder('recipe')
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
        throw notFound('Recipe with given id was not found', 'RECIPE_NOT_FOUND');
    }

    return recipe;
};

const getRecipeSummary = (recipe: Recipe) => ({
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    authorId: recipe.authorId,
    categoryId: recipe.category.id,
    difficultyId: recipe.difficulty.id,
    cookingTimeMinutes: recipe.cookingTimeMinutes,
    servings: recipe.servings,
});

const toRecipeSummary = (
    recipe: Recipe,
    author: PublicUser,
    stats: RecipeStats,
    state: RecipeUserState,
) => ({
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    cookingTimeMinutes: recipe.cookingTimeMinutes,
    servings: recipe.servings,
    category: {
        id: recipe.category.id,
        name: recipe.category.name,
    },
    difficulty: {
        id: recipe.difficulty.id,
        name: recipe.difficulty.name,
    },
    author: {
        id: author.id,
        username: author.username,
        avatarUrl: author.avatarUrl,
    },
    commentsCount: stats.commentsCount,
    likesCount: stats.likesCount,
    favoritesCount: stats.favoritesCount,
    isLiked: state.isLiked,
    isFavorite: state.isFavorite,
    createdAt: recipe.createdAt,
});

const toRecipeDetail = (
    recipe: Recipe,
    author: PublicUser,
    stats: RecipeStats,
    state: RecipeUserState,
) => ({
    ...toRecipeSummary(recipe, author, stats, state),
    ingredients: (recipe.ingredients || []).map((item) => ({
        ingredient: {
            id: item.ingredient.id,
            name: item.ingredient.name,
        },
        quantity: Number(item.quantity),
        unit: item.unit,
    })),
    steps: (recipe.steps || [])
        .slice()
        .sort((a, b) => a.stepNumber - b.stepNumber)
        .map((item) => ({
            stepNumber: item.stepNumber,
            description: item.description,
        })),
    media: (recipe.media || [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
            id: item.id,
            mediaType: item.mediaType,
            url: item.url,
            sortOrder: item.sortOrder,
        })),
});

const getRecipeResponseParts = async (recipe: Recipe, userId: number) => {
    const [author, stats, state] = await Promise.all([
        getPublicUser(recipe.authorId),
        getStats(recipe.id),
        getUserState(recipe.id, userId),
    ]);

    return { author, stats, state };
};

app.get('/health', (_request, response) => {
    response.json({ service: 'recipe-service', status: 'ok' });
});

app.get(
    '/internal/recipes/:recipeId/exists',
    requireServiceToken,
    asyncHandler(async (request, response) => {
        const recipeId = parseId(request.params.recipeId, 'recipeId');
        const recipe = await recipeRepository().findOneBy({ id: recipeId });

        if (!recipe) {
            throw notFound('Recipe with given id was not found', 'RECIPE_NOT_FOUND');
        }

        response.json({
            id: recipe.id,
            exists: true,
            authorId: recipe.authorId,
            status: 'PUBLISHED',
        });
    }),
);

app.get(
    '/internal/recipes/:recipeId/summary',
    requireServiceToken,
    asyncHandler(async (request, response) => {
        const recipe = await getRecipeOrThrow(parseId(request.params.recipeId, 'recipeId'));
        response.json(getRecipeSummary(recipe));
    }),
);

app.post(
    '/internal/recipes/batch/summaries',
    requireServiceToken,
    asyncHandler(async (request, response) => {
        const payload = request.body as { recipeIds?: unknown };

        if (!Array.isArray(payload.recipeIds) || payload.recipeIds.length === 0) {
            throw badRequest('recipeIds must be a non-empty array');
        }

        const recipeIds = payload.recipeIds.map((id) => parseId(id, 'recipeId'));
        const recipes = await recipeRepository().find({
            where: { id: In(recipeIds) },
            relations: {
                category: true,
                difficulty: true,
            },
        });

        response.json({
            items: recipes.map(getRecipeSummary),
        });
    }),
);

app.get(
    `${SETTINGS.APP_API_PREFIX}/reference-data/categories`,
    requireUser,
    asyncHandler(async (_request, response) => {
        const categories = await categoryRepository().find({ order: { id: 'ASC' } });
        response.json(categories.map((category) => ({ id: category.id, name: category.name })));
    }),
);

app.get(
    `${SETTINGS.APP_API_PREFIX}/reference-data/difficulty-levels`,
    requireUser,
    asyncHandler(async (_request, response) => {
        const levels = await difficultyRepository().find({ order: { id: 'ASC' } });
        response.json(levels.map((level) => ({ id: level.id, name: level.name })));
    }),
);

app.get(
    `${SETTINGS.APP_API_PREFIX}/reference-data/ingredients`,
    requireUser,
    asyncHandler(async (request, response) => {
        const { page, size } = parsePagination(request.query);
        const queryBuilder = ingredientRepository()
            .createQueryBuilder('ingredient')
            .orderBy('ingredient.name', 'ASC');

        if (typeof request.query.q === 'string' && request.query.q.length > 0) {
            queryBuilder.andWhere('ingredient.name ILIKE :q', {
                q: `%${request.query.q}%`,
            });
        }

        const [ingredients, totalItems] = await queryBuilder
            .skip((page - 1) * size)
            .take(size)
            .getManyAndCount();

        response.json(
            paginated(
                ingredients.map((ingredient) => ({ id: ingredient.id, name: ingredient.name })),
                page,
                size,
                totalItems,
            ),
        );
    }),
);

app.get(
    `${SETTINGS.APP_API_PREFIX}/recipes`,
    requireUser,
    asyncHandler<RequestWithUser>(async (request, response) => {
        const { page, size } = parsePagination(request.query);
        const queryBuilder = recipeRepository()
            .createQueryBuilder('recipe')
            .leftJoinAndSelect('recipe.category', 'category')
            .leftJoinAndSelect('recipe.difficulty', 'difficulty')
            .distinct(true);

        if (typeof request.query.q === 'string' && request.query.q.length > 0) {
            queryBuilder.andWhere('(recipe.title ILIKE :q OR recipe.description ILIKE :q)', {
                q: `%${request.query.q}%`,
            });
        }

        if (request.query.categoryId !== undefined) {
            queryBuilder.andWhere('category.category_id = :categoryId', {
                categoryId: parseId(request.query.categoryId, 'categoryId'),
            });
        }

        if (request.query.difficultyId !== undefined) {
            queryBuilder.andWhere('difficulty.difficulty_id = :difficultyId', {
                difficultyId: parseId(request.query.difficultyId, 'difficultyId'),
            });
        }

        if (request.query.ingredientId !== undefined) {
            queryBuilder.innerJoin(
                'recipe.ingredients',
                'ingredientFilter',
                'ingredientFilter.ingredient_id = :ingredientId',
                { ingredientId: parseId(request.query.ingredientId, 'ingredientId') },
            );
        }

        if (request.query.authorId !== undefined) {
            queryBuilder.andWhere('recipe.author_id = :authorId', {
                authorId: parseId(request.query.authorId, 'authorId'),
            });
        }

        const sortBy = typeof request.query.sortBy === 'string' ? request.query.sortBy : 'createdAt';
        const sortOrder =
            typeof request.query.sortOrder === 'string' &&
            request.query.sortOrder.toLowerCase() === 'asc'
                ? 'ASC'
                : 'DESC';

        const sortMap: Record<string, string> = {
            createdAt: 'recipe.createdAt',
            cookingTimeMinutes: 'recipe.cookingTimeMinutes',
            title: 'recipe.title',
        };

        if (!sortMap[sortBy]) {
            throw badRequest('sortBy must be createdAt, cookingTimeMinutes or title');
        }

        queryBuilder.orderBy(sortMap[sortBy], sortOrder);

        const [recipes, totalItems] = await queryBuilder
            .skip((page - 1) * size)
            .take(size)
            .getManyAndCount();

        const items = await Promise.all(
            recipes.map(async (recipe) => {
                const { author, stats, state } = await getRecipeResponseParts(
                    recipe,
                    request.user!.id,
                );
                return toRecipeSummary(recipe, author, stats, state);
            }),
        );

        response.json(paginated(items, page, size, totalItems));
    }),
);

app.post(
    `${SETTINGS.APP_API_PREFIX}/recipes`,
    requireUser,
    asyncHandler<RequestWithUser>(async (request, response) => {
        const payload = validateCreateRecipe(request.body as RecipePayload);
        const userId = request.user!.id;

        await getPublicUser(userId);

        const createdRecipeId = await recipeDataSource.transaction(async (manager) => {
            const [category, difficulty, ingredients] = await Promise.all([
                manager.getRepository(RecipeCategory).findOneBy({ id: payload.categoryId }),
                manager.getRepository(DifficultyLevel).findOneBy({ id: payload.difficultyId }),
                manager
                    .getRepository(Ingredient)
                    .findBy({ id: In(payload.ingredients.map((item) => item.ingredientId)) }),
            ]);

            if (!category || !difficulty) {
                throw badRequest('Category or difficulty level not found');
            }

            if (ingredients.length !== payload.ingredients.length) {
                throw badRequest('One or more ingredients are not found');
            }

            const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
            const recipe = await manager.getRepository(Recipe).save(
                manager.getRepository(Recipe).create({
                    authorId: userId,
                    category,
                    difficulty,
                    title: payload.title,
                    description: payload.description,
                    cookingTimeMinutes: payload.cookingTimeMinutes,
                    servings: payload.servings,
                }),
            );

            await manager.getRepository(RecipeIngredient).save(
                payload.ingredients.map((item) =>
                    manager.getRepository(RecipeIngredient).create({
                        recipe,
                        ingredient: ingredientMap.get(item.ingredientId)!,
                        quantity: String(item.quantity),
                        unit: item.unit,
                    }),
                ),
            );

            await manager.getRepository(RecipeStep).save(
                payload.steps.map((item) =>
                    manager.getRepository(RecipeStep).create({
                        recipe,
                        stepNumber: item.stepNumber,
                        description: item.description,
                    }),
                ),
            );

            if (payload.media.length > 0) {
                await manager.getRepository(RecipeMedia).save(
                    payload.media.map((item) =>
                        manager.getRepository(RecipeMedia).create({
                            recipe,
                            mediaType: item.mediaType as RecipeMediaType,
                            url: item.url,
                            sortOrder: item.sortOrder,
                        }),
                    ),
                );
            }

            return recipe.id;
        });

        const recipe = await getRecipeOrThrow(createdRecipeId);
        const { author, stats, state } = await getRecipeResponseParts(recipe, userId);

        response.status(201).json(toRecipeDetail(recipe, author, stats, state));
    }),
);

app.get(
    `${SETTINGS.APP_API_PREFIX}/recipes/:recipeId`,
    requireUser,
    asyncHandler<RequestWithUser>(async (request, response) => {
        const recipe = await getRecipeOrThrow(parseId(request.params.recipeId, 'recipeId'));
        const { author, stats, state } = await getRecipeResponseParts(recipe, request.user!.id);

        response.json(toRecipeDetail(recipe, author, stats, state));
    }),
);

app.patch(
    `${SETTINGS.APP_API_PREFIX}/recipes/:recipeId`,
    requireUser,
    asyncHandler<RequestWithUser>(async (request, response) => {
        const recipeId = parseId(request.params.recipeId, 'recipeId');
        const payload = validateUpdateRecipe(request.body as RecipePayload);
        const userId = request.user!.id;

        await recipeDataSource.transaction(async (manager) => {
            const recipe = await manager.getRepository(Recipe).findOne({
                where: { id: recipeId },
                relations: {
                    category: true,
                    difficulty: true,
                },
            });

            if (!recipe) {
                throw notFound('Recipe with given id was not found', 'RECIPE_NOT_FOUND');
            }

            if (recipe.authorId !== userId) {
                throw forbidden('You are not allowed to update this recipe');
            }

            if (payload.categoryId !== undefined) {
                const category = await manager.getRepository(RecipeCategory).findOneBy({
                    id: payload.categoryId,
                });

                if (!category) {
                    throw badRequest('Category not found');
                }

                recipe.category = category;
            }

            if (payload.difficultyId !== undefined) {
                const difficulty = await manager.getRepository(DifficultyLevel).findOneBy({
                    id: payload.difficultyId,
                });

                if (!difficulty) {
                    throw badRequest('Difficulty level not found');
                }

                recipe.difficulty = difficulty;
            }

            if (payload.title !== undefined) recipe.title = payload.title;
            if (payload.description !== undefined) recipe.description = payload.description;
            if (payload.cookingTimeMinutes !== undefined) {
                recipe.cookingTimeMinutes = payload.cookingTimeMinutes;
            }
            if (payload.servings !== undefined) recipe.servings = payload.servings;

            await manager.getRepository(Recipe).save(recipe);

            if (payload.ingredients !== undefined) {
                await manager
                    .createQueryBuilder()
                    .delete()
                    .from(RecipeIngredient)
                    .where('recipe_id = :recipeId', { recipeId: recipe.id })
                    .execute();

                if (payload.ingredients.length > 0) {
                    const ingredients = await manager
                        .getRepository(Ingredient)
                        .findBy({ id: In(payload.ingredients.map((item) => item.ingredientId)) });

                    if (ingredients.length !== payload.ingredients.length) {
                        throw badRequest('One or more ingredients are not found');
                    }

                    const ingredientMap = new Map(
                        ingredients.map((ingredient) => [ingredient.id, ingredient]),
                    );

                    await manager.getRepository(RecipeIngredient).save(
                        payload.ingredients.map((item) =>
                            manager.getRepository(RecipeIngredient).create({
                                recipe,
                                ingredient: ingredientMap.get(item.ingredientId)!,
                                quantity: String(item.quantity),
                                unit: item.unit,
                            }),
                        ),
                    );
                }
            }

            if (payload.steps !== undefined) {
                await manager
                    .createQueryBuilder()
                    .delete()
                    .from(RecipeStep)
                    .where('recipe_id = :recipeId', { recipeId: recipe.id })
                    .execute();
                await manager.getRepository(RecipeStep).save(
                    payload.steps.map((item) =>
                        manager.getRepository(RecipeStep).create({
                            recipe,
                            stepNumber: item.stepNumber,
                            description: item.description,
                        }),
                    ),
                );
            }

            if (payload.media !== undefined) {
                await manager
                    .createQueryBuilder()
                    .delete()
                    .from(RecipeMedia)
                    .where('recipe_id = :recipeId', { recipeId: recipe.id })
                    .execute();
                await manager.getRepository(RecipeMedia).save(
                    payload.media.map((item) =>
                        manager.getRepository(RecipeMedia).create({
                            recipe,
                            mediaType: item.mediaType as RecipeMediaType,
                            url: item.url,
                            sortOrder: item.sortOrder,
                        }),
                    ),
                );
            }
        });

        const recipe = await getRecipeOrThrow(recipeId);
        const { author, stats, state } = await getRecipeResponseParts(recipe, userId);

        response.json(toRecipeDetail(recipe, author, stats, state));
    }),
);

app.delete(
    `${SETTINGS.APP_API_PREFIX}/recipes/:recipeId`,
    requireUser,
    asyncHandler<RequestWithUser>(async (request, response) => {
        const recipeId = parseId(request.params.recipeId, 'recipeId');
        const recipe = await recipeRepository().findOneBy({ id: recipeId });

        if (!recipe) {
            throw notFound('Recipe with given id was not found', 'RECIPE_NOT_FOUND');
        }

        if (recipe.authorId !== request.user!.id) {
            throw forbidden('You are not allowed to delete this recipe');
        }

        await cleanupInteractions(recipe.id);
        await recipeRepository().delete({ id: recipe.id });

        response.status(204).send();
    }),
);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async (): Promise<void> => {
    await recipeDataSource.initialize();
    await seedReferenceData(recipeDataSource);

    app.listen(SETTINGS.RECIPE_SERVICE_PORT, SETTINGS.APP_HOST, () => {
        console.log(
            `recipe-service listening on ${SETTINGS.APP_PROTOCOL}://${SETTINGS.APP_HOST}:${SETTINGS.RECIPE_SERVICE_PORT}`,
        );
    });
};

void start().catch((error) => {
    console.error('recipe-service initialization failed:', error);
    process.exit(1);
});

export default app;
