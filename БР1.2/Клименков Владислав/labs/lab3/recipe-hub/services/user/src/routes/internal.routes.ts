import { Router } from 'express';
import { UserService } from '../services/user.service.js';
import { AuthService } from '../services/auth.service.js';
import { UserReadSchema } from '../schemas/user.schemas.js';

const internalRouter = Router();

// Получить пользователя по ID (для внутренних запросов recipe-service)
internalRouter.get('/internal/users/:userId', async (req, res) => {
    try {
        const { userId: userIdStr } = req.params;
        const userId = parseInt(userIdStr);
        const user = await UserService.getUser(userId);
        res.status(200).json(UserReadSchema.parse(user));
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
});

// Проверить, является ли пользователь администратором
internalRouter.get('/internal/users/:userId/is-admin', async (req, res) => {
    try {
        const { userId: userIdStr } = req.params;
        const userId = parseInt(userIdStr);
        const isAdmin = await AuthService.isUserAdmin(userId);
        res.status(200).json({ isAdmin });
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
});

// Получить нескольких пользователей по IDs
internalRouter.get('/internal/users/batch', async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids || typeof ids !== 'string') {
            res.status(400).json({ message: 'Параметр ids обязателен (пример: ids=1,2,3)' });
            return;
        }
        const userIds = ids.split(',').map(id => parseInt(id.trim()));
        const users = await Promise.all(
            userIds.map(id => UserService.getUser(id).catch(() => null))
        );
        const validUsers = users.filter(u => u !== null);
        res.status(200).json(validUsers.map(u => UserReadSchema.parse(u)));
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// Получить ID авторов, на которых подписан пользователь (для feed)
internalRouter.get('/internal/users/:userId/subscription-ids', async (req, res) => {
    try {
        const { userId: userIdStr } = req.params;
        const userId = parseInt(userIdStr);
        const { SubscriptionService } = await import('../services/subscription.service.js');
        const authorIds = await SubscriptionService.getSubscriptionUserIds(userId);
        res.status(200).json({ authorIds });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

export default internalRouter;