import { Router } from 'express';
import { env } from '../config/env';
import { internalController, socialController } from '../controllers';
import { asyncHandler, internalOnly, makeAuth, validate } from '../middlewares/common';
import {
  createCommentSchema, idParamSchema, pageQuerySchema, reactionQuerySchema,
  updateCommentSchema, userIdParamSchema,
} from '../dto';

const { authenticate, optionalAuth } = makeAuth(env.jwt.secret);

export const apiRouter = Router();

apiRouter.post('/recipes/:id/like', authenticate, validate(idParamSchema, 'params'), asyncHandler(socialController.like));
apiRouter.delete('/recipes/:id/like', authenticate, validate(idParamSchema, 'params'), asyncHandler(socialController.unlike));
apiRouter.post('/recipes/:id/favorite', authenticate, validate(idParamSchema, 'params'), asyncHandler(socialController.addFavorite));
apiRouter.delete('/recipes/:id/favorite', authenticate, validate(idParamSchema, 'params'), asyncHandler(socialController.removeFavorite));

apiRouter.get('/recipes/:id/comments', optionalAuth, validate(idParamSchema, 'params'), validate(pageQuerySchema, 'query'), asyncHandler(socialController.listComments));
apiRouter.post('/recipes/:id/comments', authenticate, validate(idParamSchema, 'params'), validate(createCommentSchema), asyncHandler(socialController.addComment));
apiRouter.patch('/comments/:id', authenticate, validate(idParamSchema, 'params'), validate(updateCommentSchema), asyncHandler(socialController.updateComment));
apiRouter.delete('/comments/:id', authenticate, validate(idParamSchema, 'params'), asyncHandler(socialController.removeComment));

apiRouter.get('/users/me/favorites', authenticate, validate(pageQuerySchema, 'query'), asyncHandler(socialController.myFavorites));

export const internalRouter = Router();
internalRouter.use(internalOnly(env.internalToken));
internalRouter.get('/social/recipes', validate(reactionQuerySchema, 'query'), asyncHandler(internalController.reactionStates));
internalRouter.get('/social/favorites/:userId', validate(userIdParamSchema, 'params'), validate(pageQuerySchema, 'query'), asyncHandler(internalController.favorites));
