import { Router } from 'express';
import { FavoriteController } from './favorite.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const favoriteController = new FavoriteController();

// Все маршруты требуют аутентификации (без изменений, но явно указываем middleware на каждый)
router.get('/me/favorites', authMiddleware, favoriteController.getMyFavorites);
router.post('/favorites/:service_id', authMiddleware, favoriteController.addToFavorites);
router.delete('/favorites/:service_id', authMiddleware, favoriteController.removeFromFavorites);

export default router;