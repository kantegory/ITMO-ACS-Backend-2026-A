import { Difficulty, MediaType, type Prisma } from "../generated/prisma/client";
import { prisma } from "../config/database.js";
import type { RecipeCreateType, RecipeRatingPutType, RecipeUpdateType } from "../schemas/recipe.schemas.js";
import { getUser } from "./userServiceClient.js";


export class RecipeService {
    static async getUserRecipes(
        userId: number,
        page: number = 1,
        limit: number = 10,
        search: string = '',
        dishTypeIds: Array<number> = [],
        ingredientIds: Array<number> = [],
        includeUnpublished: boolean = false,
        difficulty?: Difficulty,
    ) {
        const skip = (page - 1) * limit;
        const where: Prisma.RecipeWhereInput = {};
        
        where.authorId = userId;
        
        if (!includeUnpublished) {
            where.isPublished = true;
        };
        
        if (search && search.trim()) {
            where.title = {
                contains: search,
                mode: 'insensitive'
            };
        };
        
        if (difficulty) {
            where.difficulty = difficulty;
        }
        
        if (dishTypeIds.length > 0) {
            where.recipeDishTypes = {
                some: {
                    dishTypeId: { in: dishTypeIds }
                }
            };
        }
        
        if (ingredientIds.length > 0) {
            where.recipeIngredients = {
                some: {
                    ingredientId: { in: ingredientIds }
                }
            };
        }
        
        const recipes = await prisma.recipe.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                recipeDishTypes: {
                    include: {
                        dishType: true
                    }
                },
                recipeIngredients: {
                    include: {
                        ingredient: true
                    }
                },
                media: true
            }
        });
        
        // Получаем данные авторов из user-service
        const author = await getUser(userId);
        
        const transformedRecipes = recipes.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            dishTypes: recipe.recipeDishTypes.map(rdt => ({
                id: rdt.dishType.id,
                title: rdt.dishType.title
            })),
            ingredients: recipe.recipeIngredients.map(ri => ({
                id: ri.ingredient.id,
                title: ri.ingredient.title
            })),
            description: recipe.description,
            media: recipe.media.map(media => ({
                id: media.id,
                sortOrder: media.sortOrder,
                mediaType: media.mediaType,
                mediaUrl: media.mediaUrl,
                createdAt: media.createdAt,
                updatedAt: media.updatedAt
            })),
            difficulty: recipe.difficulty,
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt,
            isPublished: recipe.isPublished,
            author
        }));
        return transformedRecipes;
    }

    static async getUserSavedRecipes(
        userId: number,
        page: number = 1,
        limit: number = 10,
        search: string = '',
        dishTypeIds: Array<number> = [],
        ingredientIds: Array<number> = [],
        difficulty?: Difficulty
    ) {
        const skip = (page - 1) * limit;
        const where: Prisma.SavedRecipeWhereInput = {};
        
        where.userId = userId;
        
        where.recipe = {
            isPublished: true
        };
        
        if (search && search.trim()) {
            where.recipe = {
                ...where.recipe,
                title: {
                    contains: search,
                    mode: 'insensitive'
                }
            };
        }
        
        if (difficulty) {
            where.recipe = {
                ...where.recipe,
                difficulty: difficulty
            };
        }
        
        if (dishTypeIds.length > 0) {
            where.recipe = {
                ...where.recipe,
                recipeDishTypes: {
                    some: {
                        dishTypeId: { in: dishTypeIds }
                    }
                }
            };
        }
        
        if (ingredientIds.length > 0) {
            where.recipe = {
                ...where.recipe,
                recipeIngredients: {
                    some: {
                        ingredientId: { in: ingredientIds }
                    }
                }
            };
        }
        
        const savedRecipes = await prisma.savedRecipe.findMany({
            where,
            skip,
            take: limit,
            orderBy: { savedAt: 'desc' },
            include: {
                recipe: {
                    include: {
                        recipeDishTypes: {
                            include: {
                                dishType: true
                            }
                        },
                        recipeIngredients: {
                            include: {
                                ingredient: true
                            }
                        },
                        media: true
                    }
                }
            }
        });
        
        // Получаем данные автора
        const author = await getUser(userId);
        
        const transformedRecipes = savedRecipes.map(savedRecipe => ({
            id: savedRecipe.recipe.id,
            title: savedRecipe.recipe.title,
            dishTypes: savedRecipe.recipe.recipeDishTypes.map(rdt => ({
                id: rdt.dishType.id,
                title: rdt.dishType.title
            })),
            ingredients: savedRecipe.recipe.recipeIngredients.map(ri => ({
                id: ri.ingredient.id,
                title: ri.ingredient.title
            })),
            description: savedRecipe.recipe.description,
            media: savedRecipe.recipe.media.map(media => ({
                id: media.id,
                sortOrder: media.sortOrder,
                mediaType: media.mediaType,
                mediaUrl: media.mediaUrl,
                createdAt: media.createdAt,
                updatedAt: media.updatedAt
            })),
            difficulty: savedRecipe.recipe.difficulty,
            createdAt: savedRecipe.recipe.createdAt,
            updatedAt: savedRecipe.recipe.updatedAt,
            isPublished: savedRecipe.recipe.isPublished,
            author
        }));
        
        return transformedRecipes;
    }

    static async getRecipes(
        page: number = 1,
        limit: number = 10,
        search: string = '',
        dishTypeIds: Array<number> = [],
        ingredientIds: Array<number> = [],
        difficulty?: Difficulty
    ) {
        const skip = (page - 1) * limit;
        const where: Prisma.RecipeWhereInput = {};
        where.isPublished = true;
        if (search && search.trim()) {
            where.title = {
                contains: search,
                mode: 'insensitive'
            };
        };
        if (difficulty) {
            where.difficulty = difficulty;
        };
        if (dishTypeIds.length > 0) {
            where.recipeDishTypes = {
                some: {
                    dishTypeId: { in: dishTypeIds }
                }
            };
        };
        if (ingredientIds.length > 0) {
            where.recipeIngredients = {
                some: {
                    ingredientId: { in: ingredientIds }
                }
            }
        }
        const recipes = await prisma.recipe.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                recipeDishTypes: {
                    include: {
                        dishType: true
                    }
                },
                recipeIngredients: {
                    include: {
                        ingredient: true
                    }
                },
                media: true
            }
        });
        
        // Получаем уникальных авторов
        const authorIds = [...new Set(recipes.map(r => r.authorId))];
        const authors = await Promise.all(
            authorIds.map(id => getUser(id).catch(() => null))
        );
        const authorMap = new Map(authors.filter(a => a).map(a => [a!.id, a]));
        
        const transformedRecipes = recipes.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            dishTypes: recipe.recipeDishTypes.map(rdt => ({
                id: rdt.dishType.id,
                title: rdt.dishType.title
            })),
            ingredients: recipe.recipeIngredients.map(ri => ({
                id: ri.ingredient.id,
                title: ri.ingredient.title
            })),
            description: recipe.description,
            media: recipe.media.map(media => ({
                id: media.id,
                sortOrder: media.sortOrder,
                mediaType: media.mediaType,
                mediaUrl: media.mediaUrl,
                createdAt: media.createdAt,
                updatedAt: media.updatedAt
            })),
            difficulty: recipe.difficulty,
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt,
            isPublished: recipe.isPublished,
            author: authorMap.get(recipe.authorId)
        }));
        return transformedRecipes;
    };

    static async addRecipe(userId: number, recipeCreateData: RecipeCreateType) {
        const { title, dishTypeIds, ingredientIds, description, media, difficulty, isPublished } = recipeCreateData;

        let difficultyEnum: Difficulty | undefined;
        if (difficulty) {
            if (!Object.values(Difficulty).includes(difficulty as Difficulty)) {
                throw new Error(`Invalid difficulty value: ${difficulty}`);
            }
            difficultyEnum = difficulty as Difficulty;
        }

        const recipeData: any = {
            title,
            isPublished,
            authorId: userId,
        };

        if (description !== undefined) recipeData.description = description;
        if (difficultyEnum !== undefined) recipeData.difficulty = difficultyEnum;

        if (dishTypeIds && dishTypeIds.length > 0) {
            recipeData.recipeDishTypes = {
                create: dishTypeIds.map(dishTypeId => ({
                    dishType: { connect: { id: dishTypeId } }
                }))
            };
        }

        if (ingredientIds && ingredientIds.length > 0) {
            recipeData.recipeIngredients = {
                create: ingredientIds.map(ingredientId => ({
                    ingredient: { connect: { id: ingredientId } }
                }))
            };
        }

        if (media && media.length > 0) {
            recipeData.media = {
                create: media.map(m => ({
                    sortOrder: m.sortOrder,
                    mediaType: m.mediaType as MediaType,
                    mediaUrl: m.mediaUrl
                }))
            };
        }

        const recipe = await prisma.$transaction(async (tx) => {
            return tx.recipe.create({
                data: recipeData,
                include: {
                    recipeDishTypes: { include: { dishType: true } },
                    recipeIngredients: { include: { ingredient: true } },
                    media: true,
                }
            });
        });
        return await RecipeService.getRecipe(recipe.id);
    };

    static async getRecipe(recipeId: number) {
        const recipe = await prisma.recipe.findUnique({
            where: {
                id: recipeId,
                isPublished: true
            },
            include: {
                recipeDishTypes: {
                    include: {
                        dishType: true
                    }
                },
                recipeIngredients: {
                    include: {
                        ingredient: true
                    }
                },
                media: true
            }
        });

        if (!recipe) {
            throw new Error('Recipe not found');
        }

        const author = await getUser(recipe.authorId);

        return {
            id: recipe.id,
            title: recipe.title,
            dishTypes: recipe.recipeDishTypes.map(rdt => ({
                id: rdt.dishType.id,
                title: rdt.dishType.title
            })),
            ingredients: recipe.recipeIngredients.map(ri => ({
                id: ri.ingredient.id,
                title: ri.ingredient.title
            })),
            description: recipe.description,
            media: recipe.media.map(media => ({
                id: media.id,
                sortOrder: media.sortOrder,
                mediaType: media.mediaType,
                mediaUrl: media.mediaUrl,
                createdAt: media.createdAt,
                updatedAt: media.updatedAt
            })),
            difficulty: recipe.difficulty,
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt,
            isPublished: recipe.isPublished,
            author
        };
    };

    static async updateRecipe(recipeId: number, recipeUpdateData: RecipeUpdateType) {
        const { title, dishTypeIds, ingredientIds, description, media, difficulty, isPublished } = recipeUpdateData;

        const existingRecipe = await prisma.recipe.findUnique({
            where: { id: recipeId }
        });

        if (!existingRecipe) {
            throw new Error('Recipe not found');
        }

        let difficultyEnum: Difficulty | undefined;
        if (difficulty) {
            if (!Object.values(Difficulty).includes(difficulty as Difficulty)) {
                throw new Error(`Invalid difficulty value: ${difficulty}`);
            }
            difficultyEnum = difficulty as Difficulty;
        }

        const recipeData: any = {};

        if (title !== undefined) recipeData.title = title;
        if (description !== undefined) recipeData.description = description;
        if (difficultyEnum !== undefined) recipeData.difficulty = difficultyEnum;
        if (isPublished !== undefined) recipeData.isPublished = isPublished;

        const recipe = await prisma.$transaction(async (tx) => {
            if (Object.keys(recipeData).length > 0) {
                await tx.recipe.update({
                    where: { id: recipeId },
                    data: recipeData
                });
            }

            if (dishTypeIds !== undefined) {
                await tx.recipeDishType.deleteMany({
                    where: { recipeId }
                });
                if (dishTypeIds.length > 0) {
                    await tx.recipeDishType.createMany({
                        data: dishTypeIds.map(dishTypeId => ({
                            dishTypeId,
                            recipeId
                        }))
                    });
                }
            }

            if (ingredientIds !== undefined) {
                await tx.recipeIngredient.deleteMany({
                    where: { recipeId }
                });
                if (ingredientIds.length > 0) {
                    await tx.recipeIngredient.createMany({
                        data: ingredientIds.map(ingredientId => ({
                            ingredientId,
                            recipeId
                        }))
                    });
                }
            }

            if (media !== undefined) {
                await tx.recipeMedia.deleteMany({
                    where: { recipeId }
                });
                if (media.length > 0) {
                    await tx.recipeMedia.createMany({
                        data: media.map(m => ({
                            recipeId,
                            sortOrder: m.sortOrder ?? 0,
                            mediaType: m.mediaType as MediaType,
                            mediaUrl: m.mediaUrl ?? ''
                        }))
                    });
                }
            }

            return tx.recipe.findUnique({
                where: { id: recipeId },
                include: {
                    recipeDishTypes: {
                        include: { dishType: true }
                    },
                    recipeIngredients: {
                        include: { ingredient: true }
                    },
                    media: true
                }
            });
        });

        if (!recipe) {
            throw new Error('Recipe not found after update');
        }

        const author = await getUser(recipe.authorId);

        return {
            id: recipe.id,
            title: recipe.title,
            dishTypes: recipe.recipeDishTypes.map(rdt => ({
                id: rdt.dishType.id,
                title: rdt.dishType.title
            })),
            ingredients: recipe.recipeIngredients.map(ri => ({
                id: ri.ingredient.id,
                title: ri.ingredient.title
            })),
            description: recipe.description,
            media: recipe.media.map(mediaItem => ({
                id: mediaItem.id,
                sortOrder: mediaItem.sortOrder,
                mediaType: mediaItem.mediaType,
                mediaUrl: mediaItem.mediaUrl,
                createdAt: mediaItem.createdAt,
                updatedAt: mediaItem.updatedAt
            })),
            difficulty: recipe.difficulty,
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt,
            isPublished: recipe.isPublished,
            author
        };
    };

    static async deleteRecipe(recipeId: number) {
        await prisma.recipe.delete({
            where: { id: recipeId },
        });
    };

    static async getRecipeRating(recipeId: number, userId: number) {
        const avgResult = await prisma.recipeRating.aggregate({
            where: { recipeId },
            _avg: { rating: true },
        });
        let userRating: number | null = null;
        const userRatingRecord = await prisma.recipeRating.findUnique({
            where: {
                userId_recipeId: {
                    userId: userId,
                    recipeId: recipeId,
                },
            },
            select: { rating: true },
        });
        userRating = userRatingRecord?.rating ?? null;
        return {
            avg_rating: avgResult._avg.rating ?? null,
            rating_by_user: userRating,
        };
    };

    static async putRecipeRating(recipeId: number, recipeRatingPutData: RecipeRatingPutType, userId: number) {
        const { rating } = recipeRatingPutData;
        await prisma.recipeRating.upsert({
            where: {
                userId_recipeId: {
                    userId: userId,
                    recipeId: recipeId,
                }
            },
            update: {
                rating: rating,
                ratedAt: new Date(),
            },
            create: {
                userId: userId,
                recipeId: recipeId,
                rating: rating,
            }
        });
        return await RecipeService.getRecipeRating(recipeId, userId);
    };

    static async deleteRecipeRating(recipeId: number, userId: number) {
        await prisma.recipeRating.deleteMany({
            where: {
                userId: userId,
                recipeId: recipeId,
            },
        });
    };

    static async isRecipeSaved(recipeId: number, userId: number) {
        const saved = await prisma.savedRecipe.findUnique({
            where: {
                userId_recipeId: {
                    userId: userId,
                    recipeId: recipeId,
                }
            }
        });
        return { isSaved: saved !== null };
    };

    static async saveRecipe(recipeId: number, userId: number) {
        await prisma.savedRecipe.upsert({
            where: {
                userId_recipeId: {
                    userId: userId,
                    recipeId: recipeId,
                },
            },
            update: {},
            create: {
                userId: userId,
                recipeId: recipeId,
            },
        });
    };

    static async unsaveRecipe(recipeId: number, userId: number) {
        await prisma.savedRecipe.deleteMany({
            where: {
                userId: userId,
                recipeId: recipeId,
            },
        });
    };

    static async isUserRecipeAuthor(userId: number, recipeId: number) {
        const recipe = await prisma.recipe.findFirst({
            where: {
                id: recipeId,
                authorId: userId,
            },
            select: {
                id: true,
            },
        });
        return recipe !== null;
    };

    // Внутренний метод для получения рецептов по списку authorId (для feed)
    static async getRecipesByAuthorIds(
        authorIds: number[],
        page: number = 1,
        limit: number = 10,
        search: string = '',
        dishTypeIds: Array<number> = [],
        ingredientIds: Array<number> = [],
        difficulty?: Difficulty
    ) {
        if (authorIds.length === 0) return [];

        const skip = (page - 1) * limit;
        const where: Prisma.RecipeWhereInput = {
            isPublished: true,
            authorId: { in: authorIds },
        };

        if (search && search.trim()) {
            where.title = { contains: search, mode: 'insensitive' };
        }
        if (difficulty) {
            where.difficulty = difficulty;
        }
        if (dishTypeIds.length > 0) {
            where.recipeDishTypes = {
                some: { dishTypeId: { in: dishTypeIds } },
            };
        }
        if (ingredientIds.length > 0) {
            where.recipeIngredients = {
                some: { ingredientId: { in: ingredientIds } },
            };
        }

        const recipes = await prisma.recipe.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                recipeDishTypes: {
                    include: { dishType: true },
                },
                recipeIngredients: {
                    include: { ingredient: true },
                },
                media: true,
            },
        });

        // Получаем авторов
        const uniqueAuthorIds = [...new Set(recipes.map(r => r.authorId))];
        const authors = await Promise.all(
            uniqueAuthorIds.map(id => getUser(id).catch(() => null))
        );
        const authorMap = new Map(authors.filter(a => a).map(a => [a!.id, a]));

        return recipes.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            dishTypes: recipe.recipeDishTypes.map(rdt => ({
                id: rdt.dishType.id,
                title: rdt.dishType.title,
            })),
            ingredients: recipe.recipeIngredients.map(ri => ({
                id: ri.ingredient.id,
                title: ri.ingredient.title,
            })),
            description: recipe.description,
            media: recipe.media.map(media => ({
                id: media.id,
                sortOrder: media.sortOrder,
                mediaType: media.mediaType,
                mediaUrl: media.mediaUrl,
                createdAt: media.createdAt,
                updatedAt: media.updatedAt,
            })),
            difficulty: recipe.difficulty,
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt,
            isPublished: recipe.isPublished,
            author: authorMap.get(recipe.authorId),
        }));
    };
};