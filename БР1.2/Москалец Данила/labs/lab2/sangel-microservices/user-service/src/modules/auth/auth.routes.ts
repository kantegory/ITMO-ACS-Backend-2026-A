import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  LogoutSchema,
} from './auth.dto';

const router = Router();
const authController = new AuthController();

// Публичные маршруты
router.post('/register', validate(RegisterSchema), authController.register);
router.post('/login', validate(LoginSchema), authController.login);
router.post('/refresh', validate(RefreshTokenSchema), authController.refresh);
router.post('/logout', validate(LogoutSchema), authController.logout);

// Защищенные маршруты
router.get('/me', authMiddleware, authController.getMe);

export default router;