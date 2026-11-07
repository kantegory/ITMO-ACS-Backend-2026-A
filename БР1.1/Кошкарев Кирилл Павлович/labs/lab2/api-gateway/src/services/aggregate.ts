/**
 * Агрегация ответов нескольких сервисов.
 *
 * Карточки рецептов приходят из recipe-service без автора и без реакций:
 * профиль подставляет user-service, счётчики и состояние зрителя — social-service.
 * Оба дополнения «мягкие»: при недоступности сервиса карточка отдаётся без них.
 */
import { env } from '../config/env';
import { internalGet, internalGetSoft } from '../utils/upstream';

export interface RecipeCard {
  id: number;
  authorId: number;
  likesCount?: number;
  commentsCount?: number;
  [key: string]: unknown;
}

interface InternalUser {
  id: number;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
}

interface ReactionState {
  recipeId: number;
  likesCount: number;
  commentsCount: number;
  liked: boolean;
  favorite: boolean;
}

const chunk = <T>(items: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
};

export const fetchUsers = async (ids: Array<number | string>): Promise<Map<string, InternalUser>> => {
  const unique = [...new Set(ids.map(String))].filter((id) => id && id !== 'null');
  if (!unique.length) return new Map();
  const map = new Map<string, InternalUser>();
  // внутренний контракт ограничивает выборку 100 идентификаторами за вызов
  for (const part of chunk(unique, 100)) {
    const result = await internalGetSoft<{ data: InternalUser[] }>(
      `${env.services.user}/internal/users?ids=${part.join(',')}`, { data: [] },
    );
    result.data.forEach((user) => map.set(String(user.id), user));
  }
  return map;
};

export const fetchReactions = async (
  recipeIds: Array<number | string>,
  viewerId?: string,
): Promise<Map<string, ReactionState>> => {
  const unique = [...new Set(recipeIds.map(String))];
  if (!unique.length) return new Map();
  const map = new Map<string, ReactionState>();
  for (const part of chunk(unique, 100)) {
    const query = `ids=${part.join(',')}${viewerId ? `&userId=${viewerId}` : ''}`;
    const result = await internalGetSoft<{ data: ReactionState[] }>(
      `${env.services.social}/internal/social/recipes?${query}`, { data: [] },
    );
    result.data.forEach((state) => map.set(String(state.recipeId), state));
  }
  return map;
};

/** Дополняет карточки автором и реакциями. */
export const enrichRecipes = async <T extends RecipeCard>(
  cards: T[],
  viewerId?: string,
): Promise<Array<T & { author: unknown; isLiked: boolean; isFavorite: boolean }>> => {
  if (!cards.length) return [];
  const [users, reactions] = await Promise.all([
    fetchUsers(cards.map((card) => card.authorId)),
    fetchReactions(cards.map((card) => card.id), viewerId),
  ]);

  return cards.map((card) => {
    const author = users.get(String(card.authorId));
    const state = reactions.get(String(card.id));
    return {
      ...card,
      author: author
        ? {
            id: author.id,
            username: author.username,
            fullName: author.fullName,
            avatarUrl: author.avatarUrl,
          }
        : { id: card.authorId, username: `user${card.authorId}`, fullName: null, avatarUrl: null },
      likesCount: state?.likesCount ?? card.likesCount ?? 0,
      commentsCount: state?.commentsCount ?? card.commentsCount ?? 0,
      isLiked: state?.liked ?? false,
      isFavorite: state?.favorite ?? false,
    };
  });
};

export const fetchFollowingIds = (userId: string): Promise<{ data: number[] }> =>
  internalGet<{ data: number[] }>(`${env.services.user}/internal/users/${userId}/following`);
