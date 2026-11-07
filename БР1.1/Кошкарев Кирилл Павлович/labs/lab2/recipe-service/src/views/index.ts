import {
  Category, Cuisine, Ingredient, Recipe, RecipeIngredient, RecipeMedia, RecipeStep, Tag,
} from '../models';

const id = (value: string | number | null | undefined): number | null =>
  value === null || value === undefined ? null : Number(value);
const numeric = id;

export const categoryView = (category: Category | null | undefined) =>
  category ? { id: id(category.id), name: category.name, slug: category.slug, description: category.description ?? null } : null;

export const cuisineView = (cuisine: Cuisine | null | undefined) =>
  cuisine ? { id: id(cuisine.id), name: cuisine.name, slug: cuisine.slug } : null;

export const tagView = (tag: Tag) => ({ id: id(tag.id), name: tag.name, slug: tag.slug });

export const ingredientView = (ingredient: Ingredient) => ({
  id: id(ingredient.id),
  name: ingredient.name,
  defaultUnit: ingredient.defaultUnit,
  kcalPer100: numeric(ingredient.kcalPer100),
});

export const recipeIngredientView = (item: RecipeIngredient) => ({
  id: id(item.id),
  ingredientId: id(item.ingredientId),
  ingredient: item.ingredient ? ingredientView(item.ingredient) : null,
  quantity: numeric(item.quantity),
  unit: item.unit,
  note: item.note ?? null,
  position: item.position,
});

export const recipeStepView = (step: RecipeStep) => ({
  id: id(step.id),
  stepNumber: step.stepNumber,
  instruction: step.instruction,
  imageUrl: step.imageUrl ?? null,
  durationMinutes: step.durationMinutes ?? null,
});

export const recipeMediaView = (media: RecipeMedia) => ({
  id: id(media.id),
  url: media.url,
  type: media.type,
  caption: media.caption ?? null,
  position: media.position,
  createdAt: media.createdAt,
});

/**
 * Карточка рецепта. Автор отдаётся только идентификатором: подстановкой профиля
 * занимается API Gateway, обращаясь к user-service.
 */
export const recipeCardView = (recipe: Recipe) => ({
  id: id(recipe.id),
  title: recipe.title,
  slug: recipe.slug,
  summary: recipe.summary ?? null,
  authorId: id(recipe.authorId),
  difficulty: recipe.difficulty,
  cookTimeMinutes: recipe.cookTimeMinutes,
  prepTimeMinutes: recipe.prepTimeMinutes,
  servings: recipe.servings,
  calories: recipe.calories ?? null,
  coverImageUrl: recipe.coverImageUrl ?? null,
  status: recipe.status,
  likesCount: recipe.likesCount,
  commentsCount: recipe.commentsCount,
  category: categoryView(recipe.category),
  cuisine: cuisineView(recipe.cuisine),
  tags: (recipe.tags ?? []).map(tagView),
  publishedAt: recipe.publishedAt ?? null,
  createdAt: recipe.createdAt,
});

export const recipeView = (recipe: Recipe) => ({
  ...recipeCardView(recipe),
  description: recipe.description ?? null,
  videoUrl: recipe.videoUrl ?? null,
  ingredients: [...(recipe.ingredients ?? [])].sort((a, b) => a.position - b.position).map(recipeIngredientView),
  steps: [...(recipe.steps ?? [])].sort((a, b) => a.stepNumber - b.stepNumber).map(recipeStepView),
  media: [...(recipe.media ?? [])].sort((a, b) => a.position - b.position).map(recipeMediaView),
  updatedAt: recipe.updatedAt,
});

export const internalSummaryView = (recipe: Recipe) => ({
  id: id(recipe.id),
  title: recipe.title,
  authorId: id(recipe.authorId),
  status: recipe.status,
});

export const collection = <T, R>(items: T[], view: (item: T) => R) => ({ data: items.map(view) });
