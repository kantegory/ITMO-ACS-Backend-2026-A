import { Router, Request, Response } from 'express';
import { config } from '../config';


export const feedRouter = Router();


feedRouter.get('/', async (req: Request, res: Response) => {
    try {
        const currentUserId = req.headers[config.xUserId];
        if (!currentUserId) {
            res.status(401).json({ message: 'Не удалось определить пользователя' });
            return;
        }

        const { 
            page = '1', 
            limit = '20',
            search = '',
            dishTypeIds = '',
            ingredientIds = '',
            difficulty = '',
        } = req.query as Record<string, string>;

        // 1. Получаем ID авторов, на которых подписан пользователь, из user-service
        const userServiceUrl = config.service_urls.user;
        const subscriptionResponse = await fetch(
            `${userServiceUrl}/api/internal/users/${currentUserId}/subscription-ids`
        );

        if (!subscriptionResponse.ok) {
            res.status(502).json({ message: 'Не удалось получить подписки из user-service' });
            return;
        }

        const subscriptionData: any = await subscriptionResponse.json();
        const authorIds: number[] = subscriptionData.authorIds || [];

        if (!authorIds || authorIds.length === 0) {
            res.status(200).json([]);
            return;
        }

        // 2. Получаем рецепты от этих авторов из recipe-service
        const recipeServiceUrl = config.service_urls.recipe;
        const authorIdsParam = authorIds.join(',');
        
        const recipeResponse = await fetch(
            `${recipeServiceUrl}/api/internal/recipes/by-authors?authorIds=${authorIdsParam}&page=${page}&limit=${limit}&search=${search}&dishTypeIds=${dishTypeIds}&ingredientIds=${ingredientIds}&difficulty=${difficulty}`
        );

        if (!recipeResponse.ok) {
            res.status(502).json({ message: 'Не удалось получить рецепты из recipe-service' });
            return;
        }

        const recipes: any = await recipeResponse.json();
        res.status(200).json(recipes);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Внутренняя ошибка сервера' });
    }
});