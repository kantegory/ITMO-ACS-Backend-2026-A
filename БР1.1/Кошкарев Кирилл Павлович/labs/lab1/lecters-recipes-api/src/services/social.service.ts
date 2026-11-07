import { In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Comment, Favorite, Like, Recipe, RecipeStatus, UserRole } from '../models';
import { forbidden, notFound } from '../utils/errors';
import { buildMeta, PageParams, Paginated } from '../utils/pagination';

const likes = () => AppDataSource.getRepository(Like);
const favorites = () => AppDataSource.getRepository(Favorite);
const comments = () => AppDataSource.getRepository(Comment);
const recipes = () => AppDataSource.getRepository(Recipe);

const getVisibleRecipe = async (recipeId: string): Promise<Recipe> => {
  const recipe = await recipes().findOne({ where: { id: recipeId } });
  if (!recipe || recipe.status !== RecipeStatus.PUBLISHED) {
    throw notFound('Рецепт не найден');
  }
  return recipe;
};

export interface ReactionState {
  recipeId: number;
  liked: boolean;
  favorite: boolean;
  likesCount: number;
}

const state = async (recipe: Recipe, userId: string): Promise<ReactionState> => {
  const [like, favorite] = await Promise.all([
    likes().findOne({ where: { recipeId: recipe.id, userId } }),
    favorites().findOne({ where: { recipeId: recipe.id, userId } }),
  ]);
  const fresh = await recipes().findOne({ where: { id: recipe.id } });
  return {
    recipeId: Number(recipe.id),
    liked: Boolean(like),
    favorite: Boolean(favorite),
    likesCount: fresh?.likesCount ?? recipe.likesCount,
  };
};

export const socialService = {
  async like(recipeId: string, userId: string): Promise<ReactionState> {
    const recipe = await getVisibleRecipe(recipeId);
    const repo = likes();
    const existing = await repo.findOne({ where: { recipeId, userId } });
    if (!existing) {
      await repo.save(repo.create({ recipeId, userId }));
      await recipes().increment({ id: recipeId }, 'likesCount', 1);
    }
    return state(recipe, userId);
  },

  async unlike(recipeId: string, userId: string): Promise<ReactionState> {
    const recipe = await getVisibleRecipe(recipeId);
    const repo = likes();
    const existing = await repo.findOne({ where: { recipeId, userId } });
    if (existing) {
      await repo.remove(existing);
      await recipes().decrement({ id: recipeId }, 'likesCount', 1);
    }
    return state(recipe, userId);
  },

  async addFavorite(recipeId: string, userId: string): Promise<ReactionState> {
    const recipe = await getVisibleRecipe(recipeId);
    const repo = favorites();
    if (!(await repo.findOne({ where: { recipeId, userId } }))) {
      await repo.save(repo.create({ recipeId, userId }));
    }
    return state(recipe, userId);
  },

  async removeFavorite(recipeId: string, userId: string): Promise<ReactionState> {
    const recipe = await getVisibleRecipe(recipeId);
    const repo = favorites();
    const existing = await repo.findOne({ where: { recipeId, userId } });
    if (existing) await repo.remove(existing);
    return state(recipe, userId);
  },

  async listFavorites(userId: string, params: PageParams): Promise<Paginated<Recipe>> {
    const [rows, total] = await favorites().findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: params.skip,
      take: params.take,
    });
    if (!rows.length) return { data: [], meta: buildMeta(total, params) };

    const ids = rows.map((row) => String(row.recipeId));
    const found = await recipes().find({
      where: { id: In(ids) },
      relations: { author: true, category: true, cuisine: true, tags: true },
    });
    const byId = new Map(found.map((recipe) => [String(recipe.id), recipe]));
    const data = ids.map((recipeId) => byId.get(recipeId)).filter((item): item is Recipe => Boolean(item));
    return { data, meta: buildMeta(total, params) };
  },

  async listComments(recipeId: string, params: PageParams): Promise<Paginated<Comment>> {
    await getVisibleRecipe(recipeId);
    const [data, total] = await comments().findAndCount({
      where: { recipeId },
      order: { createdAt: 'ASC' },
      skip: params.skip,
      take: params.take,
    });
    return { data, meta: buildMeta(total, params) };
  },

  async addComment(
    recipeId: string,
    authorId: string,
    body: string,
    parentId?: string | null,
  ): Promise<Comment> {
    await getVisibleRecipe(recipeId);
    const repo = comments();
    if (parentId) {
      const parent = await repo.findOne({ where: { id: String(parentId), recipeId } });
      if (!parent) throw notFound('Родительский комментарий не найден');
    }
    const saved = await repo.save(
      repo.create({ recipeId, authorId, body, parentId: parentId ? String(parentId) : null }),
    );
    await recipes().increment({ id: recipeId }, 'commentsCount', 1);
    const created = await repo.findOne({ where: { id: saved.id } });
    if (!created) throw notFound('Комментарий не найден');
    return created;
  },

  async updateComment(commentId: string, userId: string, role: string, body: string): Promise<Comment> {
    const repo = comments();
    const comment = await repo.findOne({ where: { id: commentId } });
    if (!comment) throw notFound('Комментарий не найден');
    if (String(comment.authorId) !== userId && role !== UserRole.ADMIN) {
      throw forbidden('Можно редактировать только свои комментарии');
    }
    comment.body = body;
    return repo.save(comment);
  },

  async removeComment(commentId: string, userId: string, role: string): Promise<void> {
    const repo = comments();
    const comment = await repo.findOne({ where: { id: commentId } });
    if (!comment) throw notFound('Комментарий не найден');
    if (String(comment.authorId) !== userId && role !== UserRole.ADMIN) {
      throw forbidden('Можно удалять только свои комментарии');
    }
    const recipeId = comment.recipeId;
    await repo.remove(comment);
    await recipes().decrement({ id: recipeId }, 'commentsCount', 1);
  },
};
