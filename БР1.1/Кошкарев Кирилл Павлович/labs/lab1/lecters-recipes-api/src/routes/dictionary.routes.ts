import { Router } from 'express';
import { dictionaryController } from '../controllers/dictionary.controller';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../middlewares/asyncHandler';
import {
  createCategorySchema, createCuisineSchema, createIngredientSchema, createTagSchema,
  ingredientQuerySchema, tagQuerySchema,
} from '../dto';

export const dictionaryRouter = Router();

dictionaryRouter.get('/categories', asyncHandler(dictionaryController.listCategories));
dictionaryRouter.post(
  '/categories',
  authenticate,
  requireAdmin,
  validate(createCategorySchema),
  asyncHandler(dictionaryController.createCategory),
);

dictionaryRouter.get('/cuisines', asyncHandler(dictionaryController.listCuisines));
dictionaryRouter.post(
  '/cuisines',
  authenticate,
  requireAdmin,
  validate(createCuisineSchema),
  asyncHandler(dictionaryController.createCuisine),
);

dictionaryRouter.get(
  '/tags',
  validate(tagQuerySchema, 'query'),
  asyncHandler(dictionaryController.listTags),
);
dictionaryRouter.post(
  '/tags',
  authenticate,
  validate(createTagSchema),
  asyncHandler(dictionaryController.createTag),
);

dictionaryRouter.get(
  '/ingredients',
  validate(ingredientQuerySchema, 'query'),
  asyncHandler(dictionaryController.listIngredients),
);
dictionaryRouter.post(
  '/ingredients',
  authenticate,
  validate(createIngredientSchema),
  asyncHandler(dictionaryController.createIngredient),
);
