import type { Difficulty, Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";


export class SubscriptionService {
    static async getSubscriptions(userId: number, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const subscriptions = await prisma.subscription.findMany({
            where: { subscriberId: userId },
            include: {
                subscribedTo: true,
            },
            skip,
            take: limit,
            orderBy: { subscribedAt: 'desc' },
        });

        return subscriptions.map(sub => ({
            id: sub.subscribedTo.id,
            username: sub.subscribedTo.username,
            firstName: sub.subscribedTo.firstName,
            lastName: sub.subscribedTo.lastName,
            about: sub.subscribedTo.about,
            role: sub.subscribedTo.role,
            createdAt: sub.subscribedTo.createdAt,
            updatedAt: sub.subscribedTo.updatedAt,
        }));
    };

    static async getSubscribers(userId: number, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const subscribers = await prisma.subscription.findMany({
            where: { subscribedToId: userId },
            include: {
                subscriber: true,
            },
            skip,
            take: limit,
            orderBy: { subscribedAt: 'desc' },
        });

        return subscribers.map(sub => ({
            id: sub.subscriber.id,
            username: sub.subscriber.username,
            firstName: sub.subscriber.firstName,
            lastName: sub.subscriber.lastName,
            about: sub.subscriber.about,
            role: sub.subscriber.role,
            createdAt: sub.subscriber.createdAt,
            updatedAt: sub.subscriber.updatedAt,
        }));
    };

    static async getFeed(
        userId: number,
        page: number = 1,
        limit: number = 10,
        search: string = '',
        dishTypeIds: Array<number> = [],
        ingredientIds: Array<number> = [],
        difficulty?: Difficulty
    ) {
        // 1. Получаем ID авторов, на которых подписан пользователь
        const subscriptions = await prisma.subscription.findMany({
            where: { subscriberId: userId },
            select: { subscribedToId: true },
        });
        const authorIds = subscriptions.map(s => s.subscribedToId);
        if (authorIds.length === 0) {
            return []; // нет подписок → лента пуста
        }

        // 2. Строим условия фильтрации
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

        // 3. Запрашиваем рецепты с необходимыми связями
        const recipes = await prisma.recipe.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                author: true,
                recipeDishTypes: {
                    include: { dishType: true },
                },
                recipeIngredients: {
                    include: { ingredient: true },
                },
                media: true,
            },
        });

        // 4. Трансформируем в формат RecipeReadSchema
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
            author: {
                id: recipe.author.id,
                username: recipe.author.username,
                firstName: recipe.author.firstName,
                lastName: recipe.author.lastName,
                about: recipe.author.about,
                role: recipe.author.role,
                createdAt: recipe.author.createdAt,
                updatedAt: recipe.author.updatedAt,
            },
        }));
    };

    static async isSubscribed(currentUserId: number, userId: number) {
        const subscription = await prisma.subscription.findUnique({
            where: {
                subscriberId_subscribedToId: {
                    subscriberId: currentUserId,
                    subscribedToId: userId,
                },
            },
        });
        return { isSubscribed: !!subscription };
    };

    static async subscribe(currentUserId: number, userId: number) {
        if (currentUserId === userId) {
            throw new Error('Cannot subscribe to yourself');
        }

        // Проверяем, существует ли уже подписка
        const existing = await prisma.subscription.findUnique({
            where: {
                subscriberId_subscribedToId: {
                    subscriberId: currentUserId,
                    subscribedToId: userId,
                },
            },
        });
        if (existing) {
            throw new Error('Already subscribed');
        }

        // Создаём подписку
        await prisma.subscription.create({
            data: {
                subscriberId: currentUserId,
                subscribedToId: userId,
            },
        });
    };

    static async unsubscribe(currentUserId: number, userId: number) {
        const subscription = await prisma.subscription.findUnique({
            where: {
                subscriberId_subscribedToId: {
                    subscriberId: currentUserId,
                    subscribedToId: userId,
                },
            },
        });
        if (!subscription) {
            throw new Error('Subscription not found');
        }

        await prisma.subscription.delete({
            where: {
                subscriberId_subscribedToId: {
                    subscriberId: currentUserId,
                    subscribedToId: userId,
                },
            },
        });
    };
};
