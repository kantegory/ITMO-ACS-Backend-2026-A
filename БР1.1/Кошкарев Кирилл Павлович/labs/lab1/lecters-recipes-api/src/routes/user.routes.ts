import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../middlewares/asyncHandler';
import { idParamSchema, pageQuerySchema, searchUsersQuerySchema, updateUserSchema } from '../dto';

export const userRouter = Router();

userRouter.get('/me', authenticate, asyncHandler(userController.me));
userRouter.patch('/me', authenticate, validate(updateUserSchema), asyncHandler(userController.updateMe));
userRouter.get(
  '/me/favorites',
  authenticate,
  validate(pageQuerySchema, 'query'),
  asyncHandler(userController.favorites),
);
userRouter.get(
  '/me/feed',
  authenticate,
  validate(pageQuerySchema, 'query'),
  asyncHandler(userController.feed),
);

userRouter.get('/', validate(searchUsersQuerySchema, 'query'), asyncHandler(userController.search));
userRouter.get('/:id', validate(idParamSchema, 'params'), asyncHandler(userController.byId));
userRouter.get(
  '/:id/recipes',
  optionalAuth,
  validate(idParamSchema, 'params'),
  validate(pageQuerySchema, 'query'),
  asyncHandler(userController.recipes),
);
userRouter.post(
  '/:id/follow',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(userController.follow),
);
userRouter.delete(
  '/:id/follow',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(userController.unfollow),
);
userRouter.get(
  '/:id/followers',
  validate(idParamSchema, 'params'),
  validate(pageQuerySchema, 'query'),
  asyncHandler(userController.followers),
);
userRouter.get(
  '/:id/following',
  validate(idParamSchema, 'params'),
  validate(pageQuerySchema, 'query'),
  asyncHandler(userController.following),
);
