import { Request, Response } from 'express';
import { recipeService } from '../services/recipe.service';
import { parsePageParams } from '../utils/pagination';
import { validatedQuery } from '../middlewares/validate';
import {
  collection, recipeCardView, recipeIngredientView, recipeMediaView, recipeStepView, recipeView,
} from '../views';
import { RecipeQuery } from '../dto';
import { unauthorized } from '../utils/errors';

const requireUser = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

/** Загружает рецепт и проверяет право текущего пользователя на его изменение. */
const loadOwned = async (req: Request) => {
  const auth = requireUser(req);
  const recipe = await recipeService.getById(String(req.params.id));
  recipeService.assertCanModify(recipe, auth.id, auth.role);
  return recipe;
};

export const recipeController = {
  async search(req: Request, res: Response): Promise<void> {
    const query = validatedQuery<RecipeQuery>(req);
    const params = parsePageParams(query);
    const { data, meta } = await recipeService.search(query, params, req.user?.id);
    res.json({ data: data.map(recipeCardView), meta });
  },

  async byId(req: Request, res: Response): Promise<void> {
    const recipe = await recipeService.getForViewer(String(req.params.id), req.user?.id, req.user?.role);
    const viewer = await recipeService.viewerState(recipe.id, req.user?.id);
    res.json(recipeView(recipe, viewer));
  },

  async create(req: Request, res: Response): Promise<void> {
    const auth = requireUser(req);
    const recipe = await recipeService.create(auth.id, req.body);
    res.status(201).json(recipeView(recipe));
  },

  async update(req: Request, res: Response): Promise<void> {
    const recipe = await loadOwned(req);
    const updated = await recipeService.update(recipe, req.body);
    res.json(recipeView(updated, await recipeService.viewerState(updated.id, req.user?.id)));
  },

  async publish(req: Request, res: Response): Promise<void> {
    const recipe = await loadOwned(req);
    const published = await recipeService.publish(recipe);
    res.json(recipeView(published, await recipeService.viewerState(published.id, req.user?.id)));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const recipe = await loadOwned(req);
    await recipeService.remove(recipe);
    res.status(204).send();
  },

  async listIngredients(req: Request, res: Response): Promise<void> {
    const recipe = await recipeService.getForViewer(String(req.params.id), req.user?.id, req.user?.role);
    res.json(collection(await recipeService.listIngredients(recipe.id), recipeIngredientView));
  },

  async replaceIngredients(req: Request, res: Response): Promise<void> {
    const recipe = await loadOwned(req);
    const items = await recipeService.replaceIngredients(recipe.id, req.body.items);
    const withRelations = await recipeService.listIngredients(recipe.id);
    res.json(collection(withRelations.length ? withRelations : items, recipeIngredientView));
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
