import { Request, Response } from 'express';
import { recipeService } from '../services/recipe.service';
import { dictionaryService } from '../services/dictionary.service';
import { parsePageParams } from '../utils/pagination';
import { validatedQuery } from '../middlewares/common';
import { unauthorized } from '../utils/errors';
import { RecipeQuery } from '../dto';
import {
  categoryView, collection, cuisineView, ingredientView, internalSummaryView,
  recipeCardView, recipeIngredientView, recipeMediaView, recipeStepView, recipeView, tagView,
} from '../views';

const requireUser = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

const loadOwned = async (req: Request) => {
  const auth = requireUser(req);
  const recipe = await recipeService.getById(String(req.params.id));
  recipeService.assertCanModify(recipe, auth.id, auth.role);
  return recipe;
};

export const recipeController = {
  async search(req: Request, res: Response): Promise<void> {
    const query = validatedQuery<RecipeQuery>(req);
    const { data, meta } = await recipeService.search(query, parsePageParams(query), req.user?.id);
    res.json({ data: data.map(recipeCardView), meta });
  },
  async byId(req: Request, res: Response): Promise<void> {
    const recipe = await recipeService.getForViewer(String(req.params.id), req.user?.id, req.user?.role);
    res.json(recipeView(recipe));
  },
  async create(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    res.status(201).json(recipeView(await recipeService.create(auth.id, req.body)));
  },
  async update(req: Request, res: Response): Promise<void> {
    const recipe = await loadOwned(req);
    res.json(recipeView(await recipeService.update(recipe, req.body)));
  },
  async publish(req: Request, res: Response): Promise<void> {
    const recipe = await loadOwned(req);
    res.json(recipeView(await recipeService.publish(recipe)));
  },
  async remove(req: Request, res: Response): Promise<void> {
    await recipeService.remove(await loadOwned(req));
    res.status(204).send();
  },
  async byAuthor(req: Request, res: Response): Promise<void> {
    const authorId = String(req.params.id);
    const includeDrafts = req.user?.id === authorId || req.user?.role === 'admin';
    const { data, meta } = await recipeService.byAuthor(
      authorId, parsePageParams(validatedQuery(req)), includeDrafts,
    );
    res.json({ data: data.map(recipeCardView), meta });
  },
  async listIngredients(req: Request, res: Response): Promise<void> {
    const recipe = await recipeService.getForViewer(String(req.params.id), req.user?.id, req.user?.role);
    res.json(collection(await recipeService.listIngredients(recipe.id), recipeIngredientView));
  },
  async replaceIngredients(req: Request, res: Response): Promise<void> {
    const recipe = await loadOwned(req);
    await recipeService.replaceIngredients(recipe.id, req.body.items);
    res.json(collection(await recipeService.listIngredients(recipe.id), recipeIngredientView));
  },
  async listSteps(req: Request, res: Response): Promise<void> {
    const recipe = await recipeService.getForViewer(String(req.params.id), req.user?.id, req.user?.role);
    res.json(collection(await recipeService.listSteps(recipe.id), recipeStepView));
  },
  async replaceSteps(req: Request, res: Response): Promise<void> {
    const recipe = await loadOwned(req);
    res.json(collection(await recipeService.replaceSteps(recipe.id, req.body.items), recipeStepView));
  },
  async listMedia(req: Request, res: Response): Promise<void> {
    const recipe = await recipeService.getForViewer(String(req.params.id), req.user?.id, req.user?.role);
    res.json(collection(await recipeService.listMedia(recipe.id), recipeMediaView));
  },
  async addMedia(req: Request, res: Response): Promise<void> {
    const recipe = await loadOwned(req);
    res.status(201).json(recipeMediaView(await recipeService.addMedia(recipe.id, req.body)));
  },
  async removeMedia(req: Request, res: Response): Promise<void> {
    const recipe = await loadOwned(req);
    await recipeService.removeMedia(recipe.id, String(req.params.mediaId));
    res.status(204).send();
  },
};

export const dictionaryController = {
  async listCategories(_req: Request, res: Response): Promise<void> {
    res.json({ data: (await dictionaryService.listCategories()).map((item) => categoryView(item)) });
  },
  async createCategory(req: Request, res: Response): Promise<void> {
    res.status(201).json(categoryView(await dictionaryService.createCategory(req.body.name, req.body.description)));
  },
  async listCuisines(_req: Request, res: Response): Promise<void> {
    res.json({ data: (await dictionaryService.listCuisines()).map((item) => cuisineView(item)) });
  },
  async createCuisine(req: Request, res: Response): Promise<void> {
    res.status(201).json(cuisineView(await dictionaryService.createCuisine(req.body.name)));
  },
  async listTags(req: Request, res: Response): Promise<void> {
    const { q } = validatedQuery<{ q?: string }>(req);
    res.json(collection(await dictionaryService.listTags(q), tagView));
  },
  async createTag(req: Request, res: Response): Promise<void> {
    res.status(201).json(tagView(await dictionaryService.createTag(req.body.name)));
  },
  async listIngredients(req: Request, res: Response): Promise<void> {
    const query = validatedQuery<{ q?: string; page?: number; limit?: number }>(req);
    const { data, meta } = await dictionaryService.searchIngredients(query.q, parsePageParams(query));
    res.json({ data: data.map(ingredientView), meta });
  },
  async createIngredient(req: Request, res: Response): Promise<void> {
    const ingredient = await dictionaryService.createIngredient(
      req.body.name, req.body.defaultUnit, req.body.kcalPer100,
    );
    res.status(201).json(ingredientView(ingredient));
  },
};

export const internalController = {
  async recipesByIds(req: Request, res: Response): Promise<void> {
    const { ids } = validatedQuery<{ ids: string[] }>(req);
    res.json(collection(await recipeService.byIds(ids), recipeCardView));
  },
  async summary(req: Request, res: Response): Promise<void> {
    res.json(internalSummaryView(await recipeService.getById(String(req.params.id))));
  },
  async byAuthors(req: Request, res: Response): Promise<void> {
    const query = validatedQuery<{ authorIds: string[]; page?: number; limit?: number }>(req);
    const { data, meta } = await recipeService.byAuthors(query.authorIds, parsePageParams(query));
    res.json({ data: data.map(recipeCardView), meta });
  },
};
