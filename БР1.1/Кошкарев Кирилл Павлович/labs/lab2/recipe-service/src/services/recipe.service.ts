import { In } from 'typeorm';
import { z } from 'zod';
import { AppDataSource } from '../config/data-source';
import {
  Category, Cuisine, Ingredient, Recipe, RecipeIngredient, RecipeMedia, RecipeStatus, RecipeStep,
} from '../models';
import {
  CreateRecipeInput, RecipeQuery, UpdateRecipeInput,
  recipeIngredientInputSchema, recipeMediaInputSchema, recipeStepInputSchema,
} from '../dto';
import { forbidden, notFound, unprocessable } from '../utils/errors';
import { buildMeta, PageParams, Paginated } from '../utils/pagination';
import { uniqueSlug } from '../utils/slugify';
import { dictionaryService } from './dictionary.service';
import { recipeEvents } from '../messaging/publisher';

type IngredientInput = z.infer<typeof recipeIngredientInputSchema>;
type StepInput = z.infer<typeof recipeStepInputSchema>;
type MediaInput = z.infer<typeof recipeMediaInputSchema>;

const recipes = () => AppDataSource.getRepository(Recipe);
const recipeIngredients = () => AppDataSource.getRepository(RecipeIngredient);
const recipeSteps = () => AppDataSource.getRepository(RecipeStep);
const recipeMedia = () => AppDataSource.getRepository(RecipeMedia);
const ingredients = () => AppDataSource.getRepository(Ingredient);

const FULL_RELATIONS = {
  category: true, cuisine: true, tags: true,
  ingredients: { ingredient: true }, steps: true, media: true,
} as const;

const assertDictionary = async (id: unknown, kind: 'category' | 'cuisine'): Promise<void> => {
  if (id === null || id === undefined) return;
  const repo = kind === 'category'
    ? AppDataSource.getRepository(Category)
    : AppDataSource.getRepository(Cuisine);
  if (!(await repo.findOne({ where: { id: String(id) } }))) {
    throw notFound(kind === 'category' ? 'Категория не найдена' : 'Кухня не найдена');
  }
};

export const recipeService = {
  async search(query: RecipeQuery, params: PageParams, viewerId?: string): Promise<Paginated<Recipe>> {
    const qb = recipes().createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.category', 'category')
      .leftJoinAndSelect('recipe.cuisine', 'cuisine')
      .leftJoinAndSelect('recipe.tags', 'tag');

    if (query.status && viewerId && query.authorId && String(query.authorId) === viewerId) {
      qb.andWhere('recipe.status = :status', { status: query.status });
    } else if (query.status === RecipeStatus.PUBLISHED || !query.status) {
      qb.andWhere('recipe.status = :published', { published: RecipeStatus.PUBLISHED });
    } else {
      qb.andWhere('recipe.status = :status AND recipe.authorId = :viewer', {
        status: query.status, viewer: viewerId ?? '0',
      });
    }

    if (query.q) {
      qb.andWhere('(recipe.title ILIKE :q OR recipe.summary ILIKE :q OR recipe.description ILIKE :q)', { q: `%${query.q}%` });
    }
    if (query.categoryId) qb.andWhere('recipe.categoryId = :categoryId', { categoryId: query.categoryId });
    if (query.cuisineId) qb.andWhere('recipe.cuisineId = :cuisineId', { cuisineId: query.cuisineId });
    if (query.difficulty) qb.andWhere('recipe.difficulty = :difficulty', { difficulty: query.difficulty });
    if (query.authorId) qb.andWhere('recipe.authorId = :authorId', { authorId: query.authorId });
    if (query.maxCookTime !== undefined) qb.andWhere('recipe.cookTimeMinutes <= :maxCookTime', { maxCookTime: query.maxCookTime });
    if (query.minCookTime !== undefined) qb.andWhere('recipe.cookTimeMinutes >= :minCookTime', { minCookTime: query.minCookTime });
    if (query.ingredientId?.length) {
      qb.andWhere(
        `(SELECT COUNT(DISTINCT ri."ingredientId") FROM recipe_ingredients ri
            WHERE ri."recipeId" = recipe.id AND ri."ingredientId" IN (:...ingredientIds)) = :ingredientCount`,
        { ingredientIds: query.ingredientId, ingredientCount: query.ingredientId.length },
      );
    }
    if (query.tag?.length) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM recipe_tags rt JOIN tags t ON t.id = rt."tagId"
                  WHERE rt."recipeId" = recipe.id AND t.slug IN (:...tagSlugs))`,
        { tagSlugs: query.tag },
      );
    }

    const sortMap: Record<string, [string, 'ASC' | 'DESC']> = {
      newest: ['recipe.createdAt', 'DESC'],
      oldest: ['recipe.createdAt', 'ASC'],
      popular: ['recipe.likesCount', 'DESC'],
      cookTimeAsc: ['recipe.cookTimeMinutes', 'ASC'],
      cookTimeDesc: ['recipe.cookTimeMinutes', 'DESC'],
    };
    const [field, direction] = sortMap[query.sort] ?? sortMap.newest;
    qb.orderBy(field, direction).addOrderBy('recipe.id', 'DESC').skip(params.skip).take(params.take);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: buildMeta(total, params) };
  },

  async getById(id: string): Promise<Recipe> {
    const recipe = await recipes().findOne({ where: { id }, relations: FULL_RELATIONS });
    if (!recipe) throw notFound('Рецепт не найден');
    return recipe;
  },

  async getForViewer(id: string, viewerId?: string, viewerRole?: string): Promise<Recipe> {
    const recipe = await this.getById(id);
    const isOwner = viewerId !== undefined && String(recipe.authorId) === viewerId;
    if (recipe.status !== RecipeStatus.PUBLISHED && !isOwner && viewerRole !== 'admin') {
      throw notFound('Рецепт не найден');
    }
    return recipe;
  },

  assertCanModify(recipe: Recipe, userId: string, role?: string): void {
    if (String(recipe.authorId) !== userId && role !== 'admin') {
      throw forbidden('Операция доступна только автору рецепта');
    }
  },

  async create(authorId: string, input: CreateRecipeInput): Promise<Recipe> {
    await assertDictionary(input.categoryId, 'category');
    await assertDictionary(input.cuisineId, 'cuisine');
    const repo = recipes();
    const slug = await uniqueSlug(input.title, async (candidate) =>
      Boolean(await repo.findOne({ where: { slug: candidate } })));

    const saved = await repo.save(repo.create({
      authorId,
      title: input.title,
      slug,
      summary: input.summary ?? null,
      description: input.description ?? null,
      categoryId: input.categoryId ? String(input.categoryId) : null,
      cuisineId: input.cuisineId ? String(input.cuisineId) : null,
      difficulty: input.difficulty,
      prepTimeMinutes: input.prepTimeMinutes,
      cookTimeMinutes: input.cookTimeMinutes,
      servings: input.servings,
      calories: input.calories ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
      videoUrl: input.videoUrl ?? null,
      status: RecipeStatus.DRAFT,
      tags: input.tags?.length ? await dictionaryService.resolveTags(input.tags) : [],
    }));

    if (input.ingredients?.length) await this.replaceIngredients(saved.id, input.ingredients);
    if (input.steps?.length) await this.replaceSteps(saved.id, input.steps);
    return this.getById(saved.id);
  },

  async update(recipe: Recipe, input: UpdateRecipeInput): Promise<Recipe> {
    await assertDictionary(input.categoryId, 'category');
    await assertDictionary(input.cuisineId, 'cuisine');
    const repo = recipes();

    if (input.title !== undefined && input.title !== recipe.title) {
      recipe.title = input.title;
      recipe.slug = await uniqueSlug(input.title, async (candidate) => Boolean(
        await repo.createQueryBuilder('r')
          .where('r.slug = :candidate AND r.id <> :id', { candidate, id: recipe.id }).getOne(),
      ));
    }
    if (input.summary !== undefined) recipe.summary = input.summary ?? null;
    if (input.description !== undefined) recipe.description = input.description ?? null;
    if (input.categoryId !== undefined) recipe.categoryId = input.categoryId ? String(input.categoryId) : null;
    if (input.cuisineId !== undefined) recipe.cuisineId = input.cuisineId ? String(input.cuisineId) : null;
    if (input.difficulty !== undefined) recipe.difficulty = input.difficulty;
    if (input.prepTimeMinutes !== undefined) recipe.prepTimeMinutes = input.prepTimeMinutes;
    if (input.cookTimeMinutes !== undefined) recipe.cookTimeMinutes = input.cookTimeMinutes;
    if (input.servings !== undefined) recipe.servings = input.servings;
    if (input.calories !== undefined) recipe.calories = input.calories ?? null;
    if (input.coverImageUrl !== undefined) recipe.coverImageUrl = input.coverImageUrl ?? null;
    if (input.videoUrl !== undefined) recipe.videoUrl = input.videoUrl ?? null;
    if (input.tags !== undefined) recipe.tags = await dictionaryService.resolveTags(input.tags ?? []);
    if (input.status !== undefined) {
      recipe.status = input.status;
      if (input.status === RecipeStatus.PUBLISHED && !recipe.publishedAt) recipe.publishedAt = new Date();
    }

    const saved = await repo.save(recipe);
    if (input.ingredients !== undefined) await this.replaceIngredients(recipe.id, input.ingredients ?? []);
    if (input.steps !== undefined) await this.replaceSteps(recipe.id, input.steps ?? []);

    await recipeEvents.updated(saved);
    return this.getById(recipe.id);
  },

  async publish(recipe: Recipe): Promise<Recipe> {
    if (!(await recipeSteps().count({ where: { recipeId: recipe.id } }))) {
      throw unprocessable('Нельзя опубликовать рецепт без шагов приготовления');
    }
    if (!(await recipeIngredients().count({ where: { recipeId: recipe.id } }))) {
      throw unprocessable('Нельзя опубликовать рецепт без состава');
    }
    recipe.status = RecipeStatus.PUBLISHED;
    recipe.publishedAt = recipe.publishedAt ?? new Date();
    const saved = await recipes().save(recipe);
    // social-service подхватит событие и создаст запись в recipe_projection
    await recipeEvents.published(saved);
    return this.getById(recipe.id);
  },

  async remove(recipe: Recipe): Promise<void> {
    const id = recipe.id;
    await recipes().remove(recipe);
    // без межбазовых внешних ключей каскад обеспечивает событие
    await recipeEvents.deleted(id);
  },

  async replaceIngredients(recipeId: string, items: IngredientInput[]): Promise<RecipeIngredient[]> {
    const repo = recipeIngredients();
    if (items.length) {
      const ids = [...new Set(items.map((item) => String(item.ingredientId)))];
      const found = await ingredients().find({ where: { id: In(ids) } });
      if (found.length !== ids.length) throw notFound('Один или несколько ингредиентов не найдены в справочнике');
    }
    await repo.delete({ recipeId });
    if (!items.length) return [];

    const seen = new Set<string>();
    const rows = items.filter((item) => {
      const key = String(item.ingredientId);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((item, index) => repo.create({
      recipeId,
      ingredientId: String(item.ingredientId),
      quantity: String(item.quantity),
      unit: item.unit,
      note: item.note ?? null,
      position: item.position || index,
    }));
    await repo.save(rows);
    return repo.find({ where: { recipeId }, order: { position: 'ASC' } });
  },

  listIngredients: (recipeId: string) =>
    recipeIngredients().find({ where: { recipeId }, order: { position: 'ASC' } }),

  async replaceSteps(recipeId: string, items: StepInput[]): Promise<RecipeStep[]> {
    const repo = recipeSteps();
    if (new Set(items.map((item) => item.stepNumber)).size !== items.length) {
      throw unprocessable('Номера шагов должны быть уникальными');
    }
    await repo.delete({ recipeId });
    if (!items.length) return [];
    await repo.save(items.map((item) => repo.create({
      recipeId,
      stepNumber: item.stepNumber,
      instruction: item.instruction,
      imageUrl: item.imageUrl ?? null,
      durationMinutes: item.durationMinutes ?? null,
    })));
    return repo.find({ where: { recipeId }, order: { stepNumber: 'ASC' } });
  },

  listSteps: (recipeId: string) => recipeSteps().find({ where: { recipeId }, order: { stepNumber: 'ASC' } }),
  listMedia: (recipeId: string) => recipeMedia().find({ where: { recipeId }, order: { position: 'ASC' } }),

  addMedia: (recipeId: string, input: MediaInput) => {
    const repo = recipeMedia();
    return repo.save(repo.create({
      recipeId, url: input.url, type: input.type,
      caption: input.caption ?? null, position: input.position,
    }));
  },

  async removeMedia(recipeId: string, mediaId: string): Promise<void> {
    const repo = recipeMedia();
    const media = await repo.findOne({ where: { id: mediaId, recipeId } });
    if (!media) throw notFound('Медиа не найдено');
    await repo.remove(media);
  },

  byIds: (ids: string[]) => recipes().find({
    where: { id: In(ids) },
    relations: { category: true, cuisine: true, tags: true },
  }),

  async byAuthors(authorIds: string[], params: PageParams): Promise<Paginated<Recipe>> {
    if (!authorIds.length) return { data: [], meta: buildMeta(0, params) };
    const [data, total] = await recipes().findAndCount({
      where: { authorId: In(authorIds), status: RecipeStatus.PUBLISHED },
      relations: { category: true, cuisine: true, tags: true },
      order: { publishedAt: 'DESC', id: 'DESC' },
      skip: params.skip, take: params.take,
    });
    return { data, meta: buildMeta(total, params) };
  },

  async byAuthor(authorId: string, params: PageParams, includeDrafts: boolean): Promise<Paginated<Recipe>> {
    const [data, total] = await recipes().findAndCount({
      where: includeDrafts ? { authorId } : { authorId, status: RecipeStatus.PUBLISHED },
      relations: { category: true, cuisine: true, tags: true },
      order: { createdAt: 'DESC' },
      skip: params.skip, take: params.take,
    });
    return { data, meta: buildMeta(total, params) };
  },
};
