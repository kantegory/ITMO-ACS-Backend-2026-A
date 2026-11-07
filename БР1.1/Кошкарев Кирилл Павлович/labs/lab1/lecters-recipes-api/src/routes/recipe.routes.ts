import { Router } from 'express';
import { recipeController } from '../controllers/recipe.controller';
import { socialController } from '../controllers/social.controller';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../middlewares/asyncHandler';
import {
  createCommentSchema, createRecipeSchema, idParamSchema, mediaIdParamSchema, pageQuerySchema,
  recipeMediaInputSchema, recipeQuerySchema, replaceIngredientsSchema, replaceStepsSchema,
  updateRecipeSchema,
} from '../dto';

export const recipeRouter = Router();

recipeRouter.get(
  '/',
  optionalAuth,
  validate(recipeQuerySchema, 'query'),
  asyncHandler(recipeController.search),
);
recipeRouter.post('/', authenticate, validate(createRecipeSchema), asyncHandler(recipeController.create));

recipeRouter.get(
  '/:id',
  optionalAuth,
  validate(idParamSchema, 'params'),
  asyncHandler(recipeController.byId),
);
recipeRouter.patch(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(updateRecipeSchema),
  asyncHandler(recipeController.update),
);
recipeRouter.delete(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(recipeController.remove),
);
recipeRouter.post(
  '/:id/publish',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(recipeController.publish),
);

recipeRouter.get(
  '/:id/ingredients',
  optionalAuth,
  validate(idParamSchema, 'params'),
  asyncHandler(recipeController.listIngredients),
);
recipeRouter.put(
  '/:id/ingredients',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(replaceIngredientsSchema),
  asyncHandler(recipeController.replaceIngredients),
);

recipeRouter.get(
  '/:id/steps',
  optionalAuth,
  validate(idParamSchema, 'params'),
  asyncHandler(recipeController.listSteps),
);
recipeRouter.put(
  '/:id/steps',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(replaceStepsSchema),
  asyncHandler(recipeController.replaceSteps),
);

recipeRouter.get(
  '/:id/media',
  optionalAuth,
  validate(idParamSchema, 'params'),
  asyncHandler(recipeController.listMedia),
);
recipeRouter.post(
  '/:id/media',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(recipeMediaInputSchema),
  asyncHandler(recipeController.addMedia),
);
recipeRouter.delete(
  '/:id/media/:mediaId',
  authenticate,
  validate(mediaIdParamSchema, 'params'),
  asyncHandler(recipeController.removeMedia),
);

recipeRouter.post(
  '/:id/like',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(socialController.like),
);
recipeRouter.delete(
  '/:id/like',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(socialController.unlike),
);
recipeRouter.post(
  '/:id/favorite',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(socialController.addFavorite),
);
recipeRouter.delete(
  '/:id/favorite',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(socialController.removeFavorite),
);

recipeRouter.get(
  '/:id/comments',
  validate(idParamSchema, 'params'),
  validate(pageQuerySchema, 'query'),
  asyncHandler(socialController.listComments),
);
recipeRouter.post(
  '/:id/comments',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(createCommentSchema),
  asyncHandler(socialController.addComment),
);
