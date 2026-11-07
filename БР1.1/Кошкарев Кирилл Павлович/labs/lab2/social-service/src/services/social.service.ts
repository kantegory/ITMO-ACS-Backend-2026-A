import { In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { env } from '../config/env';
import { Comment, Favorite, Like, RecipeProjection, UserProjection } from '../models';
import { forbidden, notFound } from '../utils/errors';
import { buildMeta, PageParams, Paginated } from '../utils/pagination';
import { internalGet } from '../utils/http';
import { socialEvents } from '../messaging/publisher';

const likes = () => AppDataSource.getRepository(Like);
const favorites = () => AppDataSource.getRepository(Favorite);
const comments = () => AppDataSource.getRepository(Comment);
const recipeProjection = () => AppDataSource.getRepository(RecipeProjection);
const userProjection = () => AppDataSource.getRepository(UserProjection);

/**
 * Проверяет, что рецепт существует и опубликован.
 * Сначала смотрим локальную проекцию; если события ещё не дошли — спрашиваем
 * recipe-service напрямую и прогреваем проекцию.
 */
const ensureRecipe = async (recipeId: string): Promise<RecipeProjection> => {
  const local = await recipeProjection().findOne({ where: { recipeId } });
  if (local && local.status === 'published') return local;

  const remote = await internalGet<{ id: number; title: string; authorId: number; status: string }>(
    `${env.recipeServiceUrl}/internal/recipes/${recipeId}/summary`,
    env.internalToken,
  );
  if (!remote || remote.status !== 'published') throw notFound('Рецепт не найден');

  return recipeProjection().save(recipeProjection().create({
    recipeId: String(remote.id),
    title: remote.title,
    authorId: String(remote.authorId),
    status: remote.status,
    syncedAt: new Date(),
  }));
};

export interface ReactionState {
  recipeId: number;
  liked: boolean;
  favorite: boolean;
  likesCount: number;
  commentsCount: number;
}

const state = async (recipeId: string, userId?: string): Promise<ReactionState> => {
  const [likesCount, commentsCount, like, favorite] = await Promise.all([
    likes().count({ where: { recipeId } }),
    comments().count({ where: { recipeId } }),
    userId ? likes().findOne({ where: { recipeId, userId } }) : Promise.resolve(null),
    userId ? favorites().findOne({ where: { recipeId, userId } }) : Promise.resolve(null),
  ]);
  return {
    recipeId: Number(recipeId),
    liked: Boolean(like),
    favorite: Boolean(favorite),
    likesCount,
    commentsCount,
  };
};

export const socialService = {
  async like(recipeId: string, userId: string): Promise<ReactionState> {
    await ensureRecipe(recipeId);
    const repo = likes();
    if (!(await repo.findOne({ where: { recipeId, userId } }))) {
      await repo.save(repo.create({ recipeId, userId }));
      await socialEvents.liked(recipeId, userId);
    }
    return state(recipeId, userId);
  },

  async unlike(recipeId: string, userId: string): Promise<ReactionState> {
    await ensureRecipe(recipeId);
    const repo = likes();
    const existing = await repo.findOne({ where: { recipeId, userId } });
    if (existing) {
      await repo.remove(existing);
      await socialEvents.unliked(recipeId, userId);
    }
    return state(recipeId, userId);
  },

  async addFavorite(recipeId: string, userId: string): Promise<ReactionState> {
    await ensureRecipe(recipeId);
    const repo = favorites();
    if (!(await repo.findOne({ where: { recipeId, userId } }))) {
      await repo.save(repo.create({ recipeId, userId }));
    }
    return state(recipeId, userId);
  },

  async removeFavorite(recipeId: string, userId: string): Promise<ReactionState> {
    await ensureRecipe(recipeId);
    const repo = favorites();
    const existing = await repo.findOne({ where: { recipeId, userId } });
    if (existing) await repo.remove(existing);
    return state(recipeId, userId);
  },

  async favoriteIds(userId: string, params: PageParams): Promise<Paginated<number>> {
    const [rows, total] = await favorites().findAndCount({
      where: { userId }, order: { createdAt: 'DESC' }, skip: params.skip, take: params.take,
    });
    return { data: rows.map((row) => Number(row.recipeId)), meta: buildMeta(total, params) };
  },

  async listComments(recipeId: string, params: PageParams): Promise<{
    data: Array<{ comment: Comment; author?: UserProjection }>;
    meta: ReturnType<typeof buildMeta>;
  }> {
    await ensureRecipe(recipeId);
    const [rows, total] = await comments().findAndCount({
      where: { recipeId }, order: { createdAt: 'ASC' }, skip: params.skip, take: params.take,
    });
    const authors = rows.length
      ? await userProjection().find({ where: { userId: In([...new Set(rows.map((row) => row.authorId))]) } })
      : [];
    const byId = new Map(authors.map((author) => [String(author.userId), author]));
    return {
      data: rows.map((comment) => ({ comment, author: byId.get(String(comment.authorId)) })),
      meta: buildMeta(total, params),
    };
  },

  async addComment(
    recipeId: string, authorId: string, body: string, parentId?: string | null,
  ): Promise<{ comment: Comment; author?: UserProjection }> {
    await ensureRecipe(recipeId);
    const repo = comments();
    if (parentId) {
      const parent = await repo.findOne({ where: { id: String(parentId), recipeId } });
      if (!parent) throw notFound('Родительский комментарий не найден');
    }
    const saved = await repo.save(repo.create({
      recipeId, authorId, body, parentId: parentId ? String(parentId) : null,
    }));
    await socialEvents.commentCreated(recipeId, saved.id, authorId);
    const author = await userProjection().findOne({ where: { userId: authorId } });
    return { comment: saved, author: author ?? undefined };
  },

  async updateComment(commentId: string, userId: string, role: string, body: string): Promise<{
    comment: Comment; author?: UserProjection;
  }> {
    const repo = comments();
    const comment = await repo.findOne({ where: { id: commentId } });
    if (!comment) throw notFound('Комментарий не найден');
    if (String(comment.authorId) !== userId && role !== 'admin') {
      throw forbidden('Можно редактировать только свои комментарии');
    }
    comment.body = body;
    const saved = await repo.save(comment);
    const author = await userProjection().findOne({ where: { userId: saved.authorId } });
    return { comment: saved, author: author ?? undefined };
  },

  async removeComment(commentId: string, userId: string, role: string): Promise<void> {
    const repo = comments();
    const comment = await repo.findOne({ where: { id: commentId } });
    if (!comment) throw notFound('Комментарий не найден');
    if (String(comment.authorId) !== userId && role !== 'admin') {
      throw forbidden('Можно удалять только свои комментарии');
    }
    const { recipeId, id } = comment;
    await repo.remove(comment);
    await socialEvents.commentDeleted(recipeId, id);
  },

  /** Счётчики и состояние зрителя сразу по списку рецептов (для агрегации в Gateway). */
  async reactionStates(recipeIds: string[], userId?: string): Promise<ReactionState[]> {
    const [likeRows, commentRows, userLikes, userFavorites] = await Promise.all([
      likes().find({ where: { recipeId: In(recipeIds) } }),
      comments().find({ where: { recipeId: In(recipeIds) } }),
      userId ? likes().find({ where: { recipeId: In(recipeIds), userId } }) : Promise.resolve([]),
      userId ? favorites().find({ where: { recipeId: In(recipeIds), userId } }) : Promise.resolve([]),
    ]);
    const count = (rows: Array<{ recipeId: string }>, recipeId: string) =>
      rows.filter((row) => String(row.recipeId) === recipeId).length;

    return recipeIds.map((recipeId) => ({
      recipeId: Number(recipeId),
      likesCount: count(likeRows, recipeId),
      commentsCount: count(commentRows, recipeId),
      liked: userLikes.some((row) => String(row.recipeId) === recipeId),
      favorite: userFavorites.some((row) => String(row.recipeId) === recipeId),
    }));
  },

  projectionStats: async () => ({
    recipes: await recipeProjection().count(),
    users: await userProjection().count(),
  }),
};
