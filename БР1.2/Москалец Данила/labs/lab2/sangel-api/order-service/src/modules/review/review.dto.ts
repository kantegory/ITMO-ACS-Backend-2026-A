import { z } from 'zod';

// Create Review
export const CreateReviewSchema = z.object({
  params: z.object({
    service_id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5),
    comment: z.string().max(4096).optional().nullable(),
  }),
});

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>['body'];

// List Reviews Query
export const ReviewListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    sort_by: z.enum(['created_at', 'rating']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export type ReviewListQuery = z.infer<typeof ReviewListQuerySchema>['query'];

export interface ReviewResponse {
  id: number;
  service_id: number;
  service_name: string;
  company_id: number;
  company_title: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
  rating: number;
  comment: string | null;
  created_at: Date;
}