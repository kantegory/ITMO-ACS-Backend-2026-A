import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// GET /users/me - Get current user profile
router.get('/me', requireAuth, AuthController.getProfile);

// PUT /users/me - Update current user profile
router.put('/me', requireAuth, AuthController.updateProfile);

// PATCH /users/:id/role - Update user role (admin only)
router.patch('/:id/role', requireAuth, requireAdmin, UserController.updateUserRole);

export { router as userRoutes };
