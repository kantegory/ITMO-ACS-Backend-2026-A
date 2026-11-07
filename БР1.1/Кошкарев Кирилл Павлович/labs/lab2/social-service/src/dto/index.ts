import { z } from 'zod';

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const userIdParamSchema = z.object({ userId: z.coerce.number().int().positive() });

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, 'Комментарий не может быть пустым').max(2000),
  parentId: z.coerce.number().int().positive().nullish(),
});

export const updateCommentSchema = z.object({ body: z.string().min(1).max(2000) });

const idsTransform = (value: string, ctx: z.RefinementCtx) => {
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
};

export const reactionQuerySchema = z.object({
  ids: z.string().min(1, 'Параметр ids обязателен').transform(idsTransform),
  userId: z.coerce.number().int().positive().optional(),
});
