import { prisma } from '../config/database.js';


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

    static async getSubscriptionUserIds(userId: number): Promise<number[]> {
        const subscriptions = await prisma.subscription.findMany({
            where: { subscriberId: userId },
            select: { subscribedToId: true },
        });
        return subscriptions.map(s => s.subscribedToId);
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
            throw new Error('Нельзя подписаться на самого себя');
        }

        const existing = await prisma.subscription.findUnique({
            where: {
                subscriberId_subscribedToId: {
                    subscriberId: currentUserId,
                    subscribedToId: userId,
                },
            },
        });
        if (existing) {
            throw new Error('Уже подписан');
        }

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
            throw new Error('Подписка не найдена');
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