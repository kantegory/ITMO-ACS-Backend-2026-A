/**
 * Представления (views) — слой сериализации доменных сущностей в DTO ответов API.
 * Именно эти функции гарантируют, что наружу не утекут поля вроде passwordHash.
 */
import {
  Category, Comment, Cuisine, Ingredient, Recipe, RecipeIngredient, RecipeMedia,
  RecipeStep, Tag, User,
} from '../models';

const id = (value: string | number | null | undefined): number | null =>
  value === null || value === undefined ? null : Number(value);

const numeric = (value: string | number | null | undefined): number | null =>
  value === null || value === undefined ? null : Number(value);

export interface UserCounters {
  recipesCount?: number;
  followersCount?: number;
  followingCount?: number;
}

export const publicUserView = (user: User, counters: UserCounters = {}) => ({
  id: id(user.id),
  username: user.username,
  fullName: user.fullName ?? null,
  bio: user.bio ?? null,
  avatarUrl: user.avatarUrl ?? null,
  recipesCount: counters.recipesCount ?? 0,
  followersCount: counters.followersCount ?? 0,
  followingCount: counters.followingCount ?? 0,
  createdAt: user.createdAt,
});

export const userProfileView = (user: User, counters: UserCounters = {}) => ({
  ...publicUserView(user, counters),
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});

export const categoryView = (category: Category | null | undefined) =>
  category
    ? {
        id: id(category.id),
        name: category.name,
        slug: category.slug,
        description: category.description ?? null,
      }
    : null;

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

/** Краткая карточка рецепта — используется во всех списках и витрине. */
export const recipeCardView = (recipe: Recipe) => ({
  id: id(recipe.id),
  title: recipe.title,
  slug: recipe.slug,
  summary: recipe.summary ?? null,
  difficulty: recipe.difficulty,
  cookTimeMinutes: recipe.cookTimeMinutes,
  prepTimeMinutes: recipe.prepTimeMinutes,
  servings: recipe.servings,
  calories: recipe.calories ?? null,
  coverImageUrl: recipe.coverImageUrl ?? null,
  status: recipe.status,
  likesCount: recipe.likesCount,
  commentsCount: recipe.commentsCount,
  author: recipe.author ? publicUserView(recipe.author) : null,
  category: categoryView(recipe.category),
  cuisine: cuisineView(recipe.cuisine),
  tags: (recipe.tags ?? []).map(tagView),
  publishedAt: recipe.publishedAt ?? null,
  createdAt: recipe.createdAt,
});

export interface RecipeViewerState {
  isLiked?: boolean;
  isFavorite?: boolean;
}

/** Полная карточка рецепта: состав, шаги, медиа и состояние реакций зрителя. */
export const recipeView = (recipe: Recipe, viewer: RecipeViewerState = {}) => ({
  ...recipeCardView(recipe),
  description: recipe.description ?? null,
  videoUrl: recipe.videoUrl ?? null,
  ingredients: [...(recipe.ingredients ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(recipeIngredientView),
  steps: [...(recipe.steps ?? [])]
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map(recipeStepView),
  media: [...(recipe.media ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(recipeMediaView),
  isLiked: viewer.isLiked ?? false,
  isFavorite: viewer.isFavorite ?? false,
  updatedAt: recipe.updatedAt,
});

export const commentView = (comment: Comment) => ({
  id: id(comment.id),
  recipeId: id(comment.recipeId),
  parentId: id(comment.parentId),
  body: comment.body,
  author: comment.author ? publicUserView(comment.author) : null,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

export const collection = <T, R>(items: T[], view: (item: T) => R) => ({ data: items.map(view) });
