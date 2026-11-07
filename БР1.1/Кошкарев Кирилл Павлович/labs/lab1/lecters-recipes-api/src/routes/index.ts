import { Router } from 'express';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';
import { recipeRouter } from './recipe.routes';
import { commentRouter } from './comment.routes';
import { dictionaryRouter } from './dictionary.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'lecters-recipes-api', uptime: process.uptime() });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/recipes', recipeRouter);
apiRouter.use('/comments', commentRouter);
apiRouter.use(dictionaryRouter);
