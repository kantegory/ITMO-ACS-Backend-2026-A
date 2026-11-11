import { Router } from "express";

import { authMiddleware } from "../middleware/auth";
import { createProxy } from '../middleware/proxyHandler';
import { config } from "../config";
import { feedRouter } from './feed';


const router = Router();


router.get('/api-gateway-health', (_req, res) => {
    res.status(200).json({
        status: 'api-gateway OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
});


// ========== RECIPE SERVICE ==========

router.use('/recipe-service-health', createProxy(config.service_urls.recipe));
router.use('/recipes', authMiddleware, createProxy(config.service_urls.recipe));
router.use('/dish-types', authMiddleware, createProxy(config.service_urls.recipe));
router.use('/ingredients', authMiddleware, createProxy(config.service_urls.recipe));
router.use('/users/me/recipes', authMiddleware, createProxy(config.service_urls.recipe));
router.use('/users/me/saved-recipes', authMiddleware, createProxy(config.service_urls.recipe));
router.use('/users/:userId/recipes', authMiddleware, createProxy(config.service_urls.recipe));
router.use('/users/:userId/saved-recipes', authMiddleware, createProxy(config.service_urls.recipe));

// Recipe Service — новые маршруты (комментарии, шаги, рейтинги, сохранения)
router.use('/recipes/:recipeId/comments', authMiddleware, createProxy(config.service_urls.recipe));
router.use('/recipes/:recipeId/steps', authMiddleware, createProxy(config.service_urls.recipe));
router.use('/recipes/:recipeId/rating', authMiddleware, createProxy(config.service_urls.recipe));
router.use('/recipes/:recipeId/save', authMiddleware, createProxy(config.service_urls.recipe));


// ========== USER SERVICE ==========

router.use('/user-service-health', createProxy(config.service_urls.user));
router.use('/auth', createProxy(config.service_urls.user));

// Feed — композиция (обрабатывается в api-gateway) — ДО /users, чтобы не перехватывалось прокси
router.use('/users/me/feed', authMiddleware, feedRouter);

// User Service — новые маршруты (подписки) — ДО /users, чтобы не перехватывалось прокси
router.use('/users/me/subscriptions', authMiddleware, createProxy(config.service_urls.user));
router.use('/users/me/subscribers', authMiddleware, createProxy(config.service_urls.user));
router.use('/users/:userId/subscribe', authMiddleware, createProxy(config.service_urls.user));
router.use('/users/:userId/subscriptions', authMiddleware, createProxy(config.service_urls.user));
router.use('/users/:userId/subscribers', authMiddleware, createProxy(config.service_urls.user));

router.use('/users', authMiddleware, createProxy(config.service_urls.user));


export default router;
