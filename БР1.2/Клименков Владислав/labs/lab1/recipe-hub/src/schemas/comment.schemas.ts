import { z } from 'zod'
import { UserReadSchema } from './user.schemas.js';


export const CommentReadSchema = z.object({
    id: z.number(),
    user: UserReadSchema,
    text: z.string(),
    createdAt: z.date(),
    updatedAt: z.date()
});
export type CommentReadType = z.infer<typeof CommentReadSchema>;


export const CommentReadListSchema = z.array(CommentReadSchema);
export type CommentReadListType = z.infer<typeof CommentReadListSchema>;


export const CommentCreateSchema = z.object({
    text: z.string()
});
export type CommentCreateType = z.infer<typeof CommentCreateSchema>;


export const CommentUpdateSchema = z.object({
    text: z.string()
});
export type CommentUpdateType = z.infer<typeof CommentUpdateSchema>;


export const IsCommentLikedReadSchema = z.object({
    isLiked: z.boolean()
});
export type IsCommentLikedType = z.infer<typeof IsCommentLikedReadSchema>;
