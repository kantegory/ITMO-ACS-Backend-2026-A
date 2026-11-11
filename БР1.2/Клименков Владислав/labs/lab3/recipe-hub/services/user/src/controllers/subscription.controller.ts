import type { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { SubscriptionService } from '../services/subscription.service.js';
import { UserReadListSchema } from '../schemas/user.schemas.js';
import { IsSubscribedToUserReadSchema } from '../schemas/subscription.schema.js';


export class SubscriptionController {
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
            const subscribers = await SubscriptionService.getSubscribers(currentUserId, page, limit);
            res.status(200).json(UserReadListSchema.parse(subscribers));
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
            const subscribers = await SubscriptionService.getSubscribers(userId, page, limit);
            res.status(200).json(UserReadListSchema.parse(subscribers));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };
};