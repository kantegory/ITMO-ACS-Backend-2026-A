/** Схемы валидации входных данных (zod). Соответствуют OpenAPI-контракту ДЗ2. */
import { z } from 'zod';
import { MediaType, RecipeDifficulty, RecipeStatus } from '../models/enums';

/**
 * Ссылка на изображение или видео: либо абсолютный http(s)-URL,
 * либо путь от корня сайта (`/images/osso-buco.jpg`) — так работают файлы,
 * которые приложение отдаёт из каталога public, независимо от порта и домена.
 */
const mediaUrl = (max = 512) =>
  z.string().max(max).refine(
    (value) => /^https?:\/\//i.test(value) || value.startsWith('/'),
    'Ожидается абсолютный URL или путь от корня сайта',
  );


export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const mediaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  mediaId: z.coerce.number().int().positive(),
});

export const registerSchema = z.object({
  email: z.string().email('Некорректный формат email').max(255),
  username: z
    .string()
    .min(3, 'Минимум 3 символа')
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Допустимы латиница, цифры, точка, дефис и подчёркивание'),
  password: z.string().min(8, 'Пароль не короче 8 символов').max(72),
  fullName: z.string().max(128).nullish(),
});

export const loginSchema = z.object({
  email: z.string().email('Некорректный формат email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Некорректный refresh-токен'),
});

export const updateUserSchema = z
  .object({
    fullName: z.string().max(128).nullish(),
    bio: z.string().max(2000).nullish(),
    avatarUrl: mediaUrl().nullish(),
    password: z.string().min(8).max(72).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Передайте хотя бы одно поле');

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const searchUsersQuerySchema = pageQuerySchema.extend({
  q: z.string().max(64).optional(),
});

const toArray = <T>(value: T | T[] | undefined): T[] | undefined => {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
};

export const recipeQuerySchema = pageQuerySchema.extend({
  q: z.string().max(160).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  cuisineId: z.coerce.number().int().positive().optional(),
  difficulty: z.nativeEnum(RecipeDifficulty).optional(),
  maxCookTime: z.coerce.number().int().min(0).optional(),
  minCookTime: z.coerce.number().int().min(0).optional(),
  authorId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(RecipeStatus).optional(),
  ingredientId: z
    .preprocess(toArray, z.array(z.coerce.number().int().positive()))
    .optional(),
  tag: z.preprocess(toArray, z.array(z.string().max(48))).optional(),
  sort: z.enum(['newest', 'oldest', 'popular', 'cookTimeAsc', 'cookTimeDesc']).default('newest'),
});

export const recipeIngredientInputSchema = z.object({
  ingredientId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive('Количество должно быть больше нуля'),
  unit: z.string().max(32).default('г'),
  note: z.string().max(160).nullish(),
  position: z.coerce.number().int().min(0).default(0),
});

export const recipeStepInputSchema = z.object({
  stepNumber: z.coerce.number().int().min(1),
  instruction: z.string().min(3, 'Опишите шаг подробнее').max(4000),
  imageUrl: mediaUrl().nullish(),
  durationMinutes: z.coerce.number().int().min(0).nullish(),
});

export const recipeMediaInputSchema = z.object({
  url: mediaUrl(),
  type: z.nativeEnum(MediaType).default(MediaType.PHOTO),
  caption: z.string().max(160).nullish(),
  position: z.coerce.number().int().min(0).default(0),
});

export const createRecipeSchema = z.object({
  title: z.string().min(3, 'Название не короче 3 символов').max(160),
  summary: z.string().max(512).nullish(),
  description: z.string().nullish(),
  categoryId: z.coerce.number().int().positive().nullish(),
  cuisineId: z.coerce.number().int().positive().nullish(),
  difficulty: z.nativeEnum(RecipeDifficulty).default(RecipeDifficulty.EASY),
  prepTimeMinutes: z.coerce.number().int().min(0).default(0),
  cookTimeMinutes: z.coerce.number().int().min(0).default(0),
  servings: z.coerce.number().int().min(1).default(1),
  calories: z.coerce.number().int().min(0).nullish(),
  coverImageUrl: mediaUrl().nullish(),
  videoUrl: mediaUrl().nullish(),
  tags: z.array(z.string().min(1).max(48)).optional(),
  ingredients: z.array(recipeIngredientInputSchema).optional(),
  steps: z.array(recipeStepInputSchema).optional(),
});

export const updateRecipeSchema = createRecipeSchema
  .partial()
  .extend({ status: z.nativeEnum(RecipeStatus).optional() })
  .refine((value) => Object.keys(value).length > 0, 'Передайте хотя бы одно поле');

export const replaceIngredientsSchema = z.object({
  items: z.array(recipeIngredientInputSchema).max(100),
});

export const replaceStepsSchema = z.object({
  items: z.array(recipeStepInputSchema).max(100),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, 'Комментарий не может быть пустым').max(2000),
  parentId: z.coerce.number().int().positive().nullish(),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(64),
  description: z.string().nullish(),
});

export const createCuisineSchema = z.object({
  name: z.string().min(2).max(64),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(48),
});

export const createIngredientSchema = z.object({
  name: z.string().min(2).max(128),
  defaultUnit: z.string().max(32).default('г'),
  kcalPer100: z.coerce.number().min(0).nullish(),
});

export const ingredientQuerySchema = pageQuerySchema.extend({
  q: z.string().max(128).optional(),
});

export const tagQuerySchema = z.object({ q: z.string().max(48).optional() });

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type RecipeQuery = z.infer<typeof recipeQuerySchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
