import { Router } from 'express';
import { env } from '../config/env';
import { gatewayController, proxyTo } from '../controllers';
import { asyncHandler, makeAuth } from '../middlewares/common';

const { authenticate, optionalAuth } = makeAuth(env.jwt.secret);

export const apiRouter = Router();

// ---------- агрегирующие маршруты (данные нескольких сервисов) ----------
apiRouter.get('/users/me/favorites', authenticate, asyncHandler(gatewayController.favorites));
apiRouter.get('/users/me/feed', authenticate, asyncHandler(gatewayController.feed));
apiRouter.get('/recipes', optionalAuth, asyncHandler(gatewayController.searchRecipes));
apiRouter.get('/recipes/:id', optionalAuth, asyncHandler(gatewayController.recipeById));
apiRouter.get('/users/:id/recipes', optionalAuth, asyncHandler(gatewayController.recipesByAuthor));

// ---------- прозрачное проксирование в сервис-владелец ----------
apiRouter.use('/auth', asyncHandler(proxyTo('user')));

apiRouter.post('/recipes/:id/like', asyncHandler(proxyTo('social')));
apiRouter.delete('/recipes/:id/like', asyncHandler(proxyTo('social')));
apiRouter.post('/recipes/:id/favorite', asyncHandler(proxyTo('social')));
apiRouter.delete('/recipes/:id/favorite', asyncHandler(proxyTo('social')));
apiRouter.all('/recipes/:id/comments', asyncHandler(proxyTo('social')));
apiRouter.all('/comments/:id', asyncHandler(proxyTo('social')));

apiRouter.all('/recipes', asyncHandler(proxyTo('recipe')));
apiRouter.all('/recipes/:id', asyncHandler(proxyTo('recipe')));
apiRouter.all('/recipes/:id/publish', asyncHandler(proxyTo('recipe')));
apiRouter.all('/recipes/:id/ingredients', asyncHandler(proxyTo('recipe')));
apiRouter.all('/recipes/:id/steps', asyncHandler(proxyTo('recipe')));
apiRouter.all('/recipes/:id/media', asyncHandler(proxyTo('recipe')));
apiRouter.all('/recipes/:id/media/:mediaId', asyncHandler(proxyTo('recipe')));
apiRouter.all('/categories', asyncHandler(proxyTo('recipe')));
apiRouter.all('/cuisines', asyncHandler(proxyTo('recipe')));
apiRouter.all('/tags', asyncHandler(proxyTo('recipe')));
apiRouter.all('/ingredients', asyncHandler(proxyTo('recipe')));

apiRouter.all('/users', asyncHandler(proxyTo('user')));
apiRouter.all('/users/me', asyncHandler(proxyTo('user')));
apiRouter.all('/users/:id', asyncHandler(proxyTo('user')));
apiRouter.all('/users/:id/follow', asyncHandler(proxyTo('user')));
apiRouter.all('/users/:id/followers', asyncHandler(proxyTo('user')));
apiRouter.all('/users/:id/following', asyncHandler(proxyTo('user')));
