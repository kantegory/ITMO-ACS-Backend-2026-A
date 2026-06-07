import { z } from 'zod';

// Create Category
export const CreateCategorySchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(128, 'Title too long'),
    is_published: z.boolean().default(true).optional(),
  }),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>['body'];

// Update Category
export const UpdateCategorySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(128).optional(),
    is_published: z.boolean().optional(),
  }),
});

export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>['body'];