import { Router } from 'express';
import { env } from '../config/env';
import { dictionaryController, internalController, recipeController } from '../controllers';
import { asyncHandler, internalOnly, makeAuth, validate } from '../middlewares/common';
import {
  byAuthorsQuerySchema, createCategorySchema, createCuisineSchema, createIngredientSchema,
  createRecipeSchema, createTagSchema, idParamSchema, idsQuerySchema, ingredientQuerySchema,
  mediaIdParamSchema, pageQuerySchema, recipeMediaInputSchema, recipeQuerySchema,
  replaceIngredientsSchema, replaceStepsSchema, tagQuerySchema, updateRecipeSchema,
} from '../dto';

const { authenticate, optionalAuth, requireAdmin } = makeAuth(env.jwt.secret);

export const apiRouter = Router();

apiRouter.get('/recipes', optionalAuth, validate(recipeQuerySchema, 'query'), asyncHandler(recipeController.search));
apiRouter.post('/recipes', authenticate, validate(createRecipeSchema), asyncHandler(recipeController.create));
apiRouter.get('/recipes/:id', optionalAuth, validate(idParamSchema, 'params'), asyncHandler(recipeController.byId));
apiRouter.patch('/recipes/:id', authenticate, validate(idParamSchema, 'params'), validate(updateRecipeSchema), asyncHandler(recipeController.update));
apiRouter.delete('/recipes/:id', authenticate, validate(idParamSchema, 'params'), asyncHandler(recipeController.remove));
apiRouter.post('/recipes/:id/publish', authenticate, validate(idParamSchema, 'params'), asyncHandler(recipeController.publish));

apiRouter.get('/recipes/:id/ingredients', optionalAuth, validate(idParamSchema, 'params'), asyncHandler(recipeController.listIngredients));
apiRouter.put('/recipes/:id/ingredients', authenticate, validate(idParamSchema, 'params'), validate(replaceIngredientsSchema), asyncHandler(recipeController.replaceIngredients));
apiRouter.get('/recipes/:id/steps', optionalAuth, validate(idParamSchema, 'params'), asyncHandler(recipeController.listSteps));
apiRouter.put('/recipes/:id/steps', authenticate, validate(idParamSchema, 'params'), validate(replaceStepsSchema), asyncHandler(recipeController.replaceSteps));
apiRouter.get('/recipes/:id/media', optionalAuth, validate(idParamSchema, 'params'), asyncHandler(recipeController.listMedia));
apiRouter.post('/recipes/:id/media', authenticate, validate(idParamSchema, 'params'), validate(recipeMediaInputSchema), asyncHandler(recipeController.addMedia));
apiRouter.delete('/recipes/:id/media/:mediaId', authenticate, validate(mediaIdParamSchema, 'params'), asyncHandler(recipeController.removeMedia));

apiRouter.get('/users/:id/recipes', optionalAuth, validate(idParamSchema, 'params'), validate(pageQuerySchema, 'query'), asyncHandler(recipeController.byAuthor));

apiRouter.get('/categories', asyncHandler(dictionaryController.listCategories));
apiRouter.post('/categories', authenticate, requireAdmin, validate(createCategorySchema), asyncHandler(dictionaryController.createCategory));
apiRouter.get('/cuisines', asyncHandler(dictionaryController.listCuisines));
apiRouter.post('/cuisines', authenticate, requireAdmin, validate(createCuisineSchema), asyncHandler(dictionaryController.createCuisine));
apiRouter.get('/tags', validate(tagQuerySchema, 'query'), asyncHandler(dictionaryController.listTags));
apiRouter.post('/tags', authenticate, validate(createTagSchema), asyncHandler(dictionaryController.createTag));
apiRouter.get('/ingredients', validate(ingredientQuerySchema, 'query'), asyncHandler(dictionaryController.listIngredients));
apiRouter.post('/ingredients', authenticate, validate(createIngredientSchema), asyncHandler(dictionaryController.createIngredient));

export const internalRouter = Router();
internalRouter.use(internalOnly(env.internalToken));
internalRouter.get('/recipes', validate(idsQuerySchema, 'query'), asyncHandler(internalController.recipesByIds));
internalRouter.get('/recipes/by-authors', validate(byAuthorsQuerySchema, 'query'), asyncHandler(internalController.byAuthors));
internalRouter.get('/recipes/:id/summary', validate(idParamSchema, 'params'), asyncHandler(internalController.summary));
