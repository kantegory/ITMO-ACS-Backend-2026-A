import type { Response } from 'express'
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { SubscriptionService } from '../services/subscription.service.js';
import { UserReadListSchema } from '../schemas/user.schemas.js';
import type { Difficulty } from '@prisma/client';
import { RecipeReadListSchema } from '../schemas/recipe.schemas.js';
import { IsSubscribedToUserReadSchema } from '../schemas/subscription.schema.js';


export class SubscriptionController {
    private static parseQueryParams(req: AuthRequest) {
        const { 
            page:pageStr='1', 
            limit:limitStr='20',
            search="",
            dishTypeIds:dishTypeIdsStr="",
            ingredientIds:ingredientIdsStr="",
            difficulty="",
        } = req.query;
        const page = parseInt(pageStr as string);
        const limit = parseInt(limitStr as string);
        let dishTypeIds: Array<number>;
        if (dishTypeIdsStr === "") {
            dishTypeIds = [];
        } else {
            dishTypeIds = (dishTypeIdsStr as string)
                .split(',')
                .map(id => parseInt(id.trim()));
        };
        let ingredientIds: Array<number>;
        if (ingredientIdsStr === "") {
            ingredientIds = [];
        } else {
            ingredientIds = (ingredientIdsStr as string)
                .split(',')
                .map(id => parseInt(id.trim()));
        };
        return {
            page,
            limit,
            search,
            dishTypeIds,
            ingredientIds,
            difficulty
        };
    };

    static async getCurrentUserSubscriptions(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { 
                page:pageStr='1', 
                limit:limitStr='20'
            } = req.query;
            const page = parseInt(pageStr as string);
            const limit = parseInt(limitStr as string);
            const subscriptions = await SubscriptionService.getSubscriptions(currentUserId, page, limit);
            res.status(200).json(UserReadListSchema.parse(subscriptions));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getCurrentUserSubscribers(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { 
                page:pageStr='1', 
                limit:limitStr='20'
            } = req.query;
            const page = parseInt(pageStr as string);
            const limit = parseInt(limitStr as string);
            const subscriptions = await SubscriptionService.getSubscribers(currentUserId, page, limit);
            res.status(200).json(UserReadListSchema.parse(subscriptions));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getFeed(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const {
                page,
                limit,
                search,
                dishTypeIds,
                ingredientIds,
                difficulty
            } = SubscriptionController.parseQueryParams(req);
            const feed = await SubscriptionService.getFeed(
                currentUserId,
                page,
                limit,
                search as string,
                dishTypeIds,
                ingredientIds,
                difficulty as Difficulty
            );
            res.status(200).json(RecipeReadListSchema.parse(feed));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async isSubscribed(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { userId:userIdStr } = req.params;
            const userId = parseInt(userIdStr as string);
            const isSubscribed = await SubscriptionService.isSubscribed(currentUserId, userId);
            res.status(200).json(IsSubscribedToUserReadSchema.parse(isSubscribed));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async subscribe(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { userId:userIdStr } = req.params;
            const userId = parseInt(userIdStr as string);
            await SubscriptionService.subscribe(currentUserId, userId);
            res.status(200).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async unsubscribe(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { userId:userIdStr } = req.params;
            const userId = parseInt(userIdStr as string);
            await SubscriptionService.unsubscribe(currentUserId, userId);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getUserSubscriptions(req: AuthRequest, res: Response) {
        try {
            const { userId:userIdStr } = req.params;
            const userId = parseInt(userIdStr as string);
            const { 
                page:pageStr='1', 
                limit:limitStr='20'
            } = req.query;
            const page = parseInt(pageStr as string);
            const limit = parseInt(limitStr as string);
            const subscriptions = await SubscriptionService.getSubscriptions(userId, page, limit);
            res.status(200).json(UserReadListSchema.parse(subscriptions));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getUserSubscribers(req: AuthRequest, res: Response) {
        try {
            const { userId:userIdStr } = req.params;
            const userId = parseInt(userIdStr as string);
            const { 
                page:pageStr='1', 
                limit:limitStr='20'
            } = req.query;
            const page = parseInt(pageStr as string);
            const limit = parseInt(limitStr as string);
            const subscriptions = await SubscriptionService.getSubscribers(userId, page, limit);
            res.status(200).json(UserReadListSchema.parse(subscriptions));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };
};
