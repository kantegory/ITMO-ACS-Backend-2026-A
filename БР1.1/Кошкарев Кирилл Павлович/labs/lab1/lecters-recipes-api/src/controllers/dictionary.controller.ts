import { Request, Response } from 'express';
import { dictionaryService } from '../services/dictionary.service';
import { categoryView, collection, cuisineView, ingredientView, tagView } from '../views';
import { parsePageParams } from '../utils/pagination';
import { validatedQuery } from '../middlewares/validate';

export const dictionaryController = {
  async listCategories(_req: Request, res: Response): Promise<void> {
    const items = await dictionaryService.listCategories();
    res.json({ data: items.map((item) => categoryView(item)) });
  },

  async createCategory(req: Request, res: Response): Promise<void> {
    const category = await dictionaryService.createCategory(req.body.name, req.body.description);
    res.status(201).json(categoryView(category));
  },

  async listCuisines(_req: Request, res: Response): Promise<void> {
    const items = await dictionaryService.listCuisines();
    res.json({ data: items.map((item) => cuisineView(item)) });
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
