import { EventBus } from './bus';
import { env } from '../config/env';

export const bus = new EventBus({
  url: env.rabbit.url,
  exchange: env.rabbit.exchange,
  producer: env.service,
  enabled: env.rabbit.enabled,
});

/** События реакций: recipe-service пересчитывает по ним свои счётчики. */
export const socialEvents = {
  liked: (recipeId: string, userId: string) =>
    bus.publish('social.recipe.liked', { recipeId: Number(recipeId), userId: Number(userId), delta: 1 }),
  unliked: (recipeId: string, userId: string) =>
    bus.publish('social.recipe.unliked', { recipeId: Number(recipeId), userId: Number(userId), delta: -1 }),
  commentCreated: (recipeId: string, commentId: string, authorId: string) =>
    bus.publish('social.comment.created', {
      recipeId: Number(recipeId), commentId: Number(commentId), authorId: Number(authorId), delta: 1,
    }),
  commentDeleted: (recipeId: string, commentId: string) =>
    bus.publish('social.comment.deleted', {
      recipeId: Number(recipeId), commentId: Number(commentId), delta: -1,
    }),
};
