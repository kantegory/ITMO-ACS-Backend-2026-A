import { Comment, UserProjection } from '../models';

const id = (value: string | number | null | undefined): number | null =>
  value === null || value === undefined ? null : Number(value);

export const authorView = (projection: UserProjection | undefined, authorId: string) =>
  projection
    ? {
        id: id(projection.userId),
        username: projection.username,
        fullName: projection.fullName ?? null,
        avatarUrl: projection.avatarUrl ?? null,
      }
    // проекция ещё не прогрета событием — отдаём минимум, не ломая ответ
    : { id: id(authorId), username: `user${authorId}`, fullName: null, avatarUrl: null };

export const commentView = (comment: Comment, author?: UserProjection) => ({
  id: id(comment.id),
  recipeId: id(comment.recipeId),
  parentId: id(comment.parentId),
  body: comment.body,
  author: authorView(author, comment.authorId),
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});
