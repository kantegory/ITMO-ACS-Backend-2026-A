import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// GET /admin/dashboard - Get dashboard statistics (admin only)
router.get('/dashboard', requireAuth, requireAdmin, AdminController.getDashboardStats);

// PATCH /admin/users/:userId/role - Update user role (admin only)
router.patch('/users/:userId/role', requireAuth, requireAdmin, AdminController.updateUserRole);

// PATCH /admin/restaurants/:restaurantId/status - Toggle restaurant status (admin only)
router.patch('/restaurants/:restaurantId/status', requireAuth, requireAdmin, AdminController.toggleRestaurantStatus);

// DELETE /admin/users/:userId - Delete user (admin only)
router.delete('/users/:userId', requireAuth, requireAdmin, AdminController.deleteUser);

export { router as adminRoutes };