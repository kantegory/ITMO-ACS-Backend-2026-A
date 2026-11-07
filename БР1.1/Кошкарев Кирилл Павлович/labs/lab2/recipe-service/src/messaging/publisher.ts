import { EventBus } from './bus';
import { env } from '../config/env';
import { Recipe } from '../models';

export const bus = new EventBus({
  url: env.rabbit.url,
  exchange: env.rabbit.exchange,
  producer: env.service,
  enabled: env.rabbit.enabled,
});

const payload = (recipe: Recipe) => ({
  recipeId: Number(recipe.id),
  authorId: Number(recipe.authorId),
  title: recipe.title,
  status: recipe.status,
});

export const recipeEvents = {
  published: (recipe: Recipe) => bus.publish('recipe.published', payload(recipe)),
  updated: (recipe: Recipe) => bus.publish('recipe.updated', payload(recipe)),
  deleted: (recipeId: string) => bus.publish('recipe.deleted', { recipeId: Number(recipeId) }),
};
