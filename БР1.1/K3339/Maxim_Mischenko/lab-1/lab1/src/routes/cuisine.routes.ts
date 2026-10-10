import { Router } from 'express';
import { CuisineController } from '../controllers/cuisine.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// GET /cuisines - Get all cuisines (public)
router.get('/', CuisineController.getAllCuisines);

// GET /cuisines/:id - Get cuisine by ID (public)
router.get('/:id', CuisineController.getCuisineById);

// POST /cuisines - Create a new cuisine (admin only)
router.post('/', requireAuth, requireAdmin, CuisineController.createCuisine);

// DELETE /cuisines/:id - Delete cuisine (admin only)
router.delete('/:id', requireAuth, requireAdmin, CuisineController.deleteCuisine);

export { router as cuisineRoutes };
