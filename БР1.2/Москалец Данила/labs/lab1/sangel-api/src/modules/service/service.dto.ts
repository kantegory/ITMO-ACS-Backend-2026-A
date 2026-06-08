import { z } from 'zod';

const BooleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return value;
}, z.boolean().optional());

// Create Service
export const CreateServiceSchema = z.object({
  params: z.object({
    company_id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    name: z.string().min(1, 'Name is required').max(256),
    description: z.string().max(4096).optional().nullable(),
    price: z.number().min(0, 'Price must be >= 0'),
    is_published: z.boolean().default(true).optional(),
    category_ids: z.array(z.number().int()).optional().default([]),
  }),
});

export type CreateServiceDto = z.infer<typeof CreateServiceSchema>['body'];

// Update Service
export const UpdateServiceSchema = z.object({
  params: z.object({
    service_id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    name: z.string().max(256).optional(),
    description: z.string().max(4096).nullable().optional(),
    price: z.number().min(0).optional(),
    is_published: z.boolean().optional(),
    category_ids: z.array(z.number().int()).optional(),
  }),
});

export type UpdateServiceDto = z.infer<typeof UpdateServiceSchema>['body'];

// List Services Query
export const ServiceListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    company_id: z.coerce.number().int().optional(),
    category_id: z.coerce.number().int().optional(),
    price_min: z.coerce.number().min(0).optional(),
    price_max: z.coerce.number().min(0).optional(),
    with_discount: BooleanQuerySchema,
    sort_by: z.enum(['created_at', 'price', 'final_price', 'rating']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export type ServiceListQuery = z.infer<typeof ServiceListQuerySchema>['query'];

// Service Response
export interface ServiceResponse {
  id: number;
  company_id: number;
  company_title: string;
  name: string;
  description: string | null;
  price: number;
  final_price: number;
  discount: DiscountShortResponse | null;
  is_published: boolean;
  categories: CategoryResponse[];
  avg_rating: number | null;
  total_reviews: number;
  created_at: Date;
}

export interface DiscountShortResponse {
  id: number;
  percentage: number;
  start_at: Date;
  end_at: Date;
  is_active: boolean;
}

export interface CategoryResponse {
  id: number;
  title: string;
}
