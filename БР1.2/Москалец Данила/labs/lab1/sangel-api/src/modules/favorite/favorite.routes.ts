import { Router } from 'express';
import { FavoriteController } from './favorite.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const favoriteController = new FavoriteController();

// Все маршруты требуют аутентификации
router.use(authMiddleware);

router.get('/me/favorites', favoriteController.getMyFavorites);
router.post('/favorites/:service_id', favoriteController.addToFavorites);
router.delete('/favorites/:service_id', favoriteController.removeFromFavorites);

export default router;