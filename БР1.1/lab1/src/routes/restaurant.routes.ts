import { Router } from 'express';
import { RestaurantController } from '../controllers/restaurant.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// GET /restaurants - Get all restaurants (public)
router.get('/', RestaurantController.getAllRestaurants);

// GET /restaurants/:id - Get restaurant by ID (public)
router.get('/:id', RestaurantController.getRestaurantById);

// POST /restaurants - Create a new restaurant (admin only)
router.post('/', requireAuth, requireAdmin, RestaurantController.createRestaurant);

// PATCH /restaurants/:id - Update restaurant (admin only)
router.patch('/:id', requireAuth, requireAdmin, RestaurantController.updateRestaurant);

// DELETE /restaurants/:id - Delete restaurant (admin only)
router.delete('/:id', requireAuth, requireAdmin, RestaurantController.deleteRestaurant);

export { router as restaurantRoutes };