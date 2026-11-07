import { Router } from 'express';
import { env } from '../config/env';
import { authController, internalController, userController } from '../controllers';
import { asyncHandler, internalOnly, makeAuth, validate } from '../middlewares/common';
import {
  idParamSchema, idsQuerySchema, loginSchema, pageQuerySchema, refreshSchema,
  registerSchema, searchUsersQuerySchema, updateUserSchema,
} from '../dto';

const { authenticate } = makeAuth(env.jwt.secret);

export const apiRouter = Router();

apiRouter.post('/auth/register', validate(registerSchema), asyncHandler(authController.register));
apiRouter.post('/auth/login', validate(loginSchema), asyncHandler(authController.login));
apiRouter.post('/auth/refresh', validate(refreshSchema), asyncHandler(authController.refresh));

apiRouter.get('/users/me', authenticate, asyncHandler(userController.me));
apiRouter.patch('/users/me', authenticate, validate(updateUserSchema), asyncHandler(userController.updateMe));
apiRouter.get('/users', validate(searchUsersQuerySchema, 'query'), asyncHandler(userController.search));
apiRouter.get('/users/:id', validate(idParamSchema, 'params'), asyncHandler(userController.byId));
apiRouter.post('/users/:id/follow', authenticate, validate(idParamSchema, 'params'), asyncHandler(userController.follow));
apiRouter.delete('/users/:id/follow', authenticate, validate(idParamSchema, 'params'), asyncHandler(userController.unfollow));
apiRouter.get('/users/:id/followers', validate(idParamSchema, 'params'), validate(pageQuerySchema, 'query'), asyncHandler(userController.followers));
apiRouter.get('/users/:id/following', validate(idParamSchema, 'params'), validate(pageQuerySchema, 'query'), asyncHandler(userController.following));

export const internalRouter = Router();
internalRouter.use(internalOnly(env.internalToken));
internalRouter.get('/users', validate(idsQuerySchema, 'query'), asyncHandler(internalController.usersByIds));
internalRouter.get('/users/:id/following', validate(idParamSchema, 'params'), asyncHandler(internalController.following));
internalRouter.get('/users/:id/exists', validate(idParamSchema, 'params'), asyncHandler(internalController.exists));
