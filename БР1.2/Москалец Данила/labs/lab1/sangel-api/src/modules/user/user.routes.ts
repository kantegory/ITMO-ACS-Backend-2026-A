import { Router } from 'express';
import { UserController } from './user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { UpdateProfileSchema, ChangePasswordSchema } from './user.dto';

const router = Router();
const userController = new UserController();

// Все маршруты требуют аутентификации
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, validate(UpdateProfileSchema), userController.updateProfile);
router.put('/profile/password', authMiddleware, validate(ChangePasswordSchema), userController.changePassword);

export default router;