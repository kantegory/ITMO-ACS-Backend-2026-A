import { Router } from 'express';
import { RestaurantController } from '../controllers/restaurant.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// GET /restaurants - Get all restaurants (public)
router.get('/', RestaurantController.getAllRestaurants);

// GET /restaurants/:id - Get restaurant by ID (public)
router.get('/:id', RestaurantController.getRestaurantById);

// GET /restaurants/:id/tables - Get restaurant tables (public)
router.get('/:id/tables', RestaurantController.getRestaurantTables);

// POST /restaurants/:id/reviews - Create a review for a restaurant (authenticated users)
router.post('/:id/reviews', requireAuth, RestaurantController.createRestaurantReview);

// POST /restaurants - Create a new restaurant (admin only)
router.post('/', requireAuth, requireAdmin, RestaurantController.createRestaurant);

// PATCH /restaurants/:id - Update restaurant (admin only)
router.patch('/:id', requireAuth, requireAdmin, RestaurantController.updateRestaurant);

// DELETE /restaurants/:id - Delete restaurant (admin only)
router.delete('/:id', requireAuth, requireAdmin, RestaurantController.deleteRestaurant);

export { router as restaurantRoutes };