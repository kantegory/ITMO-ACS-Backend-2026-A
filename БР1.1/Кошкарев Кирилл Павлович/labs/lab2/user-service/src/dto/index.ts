import { z } from 'zod';

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


export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const registerSchema = z.object({
  email: z.string().email('Некорректный формат email').max(255),
  username: z.string().min(3, 'Минимум 3 символа').max(64)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Допустимы латиница, цифры, точка, дефис и подчёркивание'),
  password: z.string().min(8, 'Пароль не короче 8 символов').max(72),
  fullName: z.string().max(128).nullish(),
});

export const loginSchema = z.object({
  email: z.string().email('Некорректный формат email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

export const refreshSchema = z.object({ refreshToken: z.string().min(10) });

export const updateUserSchema = z.object({
  fullName: z.string().max(128).nullish(),
  bio: z.string().max(2000).nullish(),
  avatarUrl: mediaUrl().nullish(),
  password: z.string().min(8).max(72).optional(),
}).refine((value) => Object.keys(value).length > 0, 'Передайте хотя бы одно поле');

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const searchUsersQuerySchema = pageQuerySchema.extend({ q: z.string().max(64).optional() });

/** Разбор параметра ids=1,2,3 для массовых внутренних выборок. */
export const idsQuerySchema = z.object({
  ids: z.string().min(1, 'Параметр ids обязателен').transform((value, ctx) => {
    const parsed = value.split(',').map((part) => part.trim()).filter(Boolean);
    if (!parsed.length || parsed.length > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ожидается от 1 до 100 идентификаторов' });
      return z.NEVER;
    }
    if (parsed.some((part) => !/^\d+$/.test(part))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Идентификаторы должны быть целыми числами' });
      return z.NEVER;
    }
    return parsed;
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
