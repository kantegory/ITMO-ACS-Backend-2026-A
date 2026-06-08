import { z } from 'zod';

export const CreateCompanySchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(256, 'Title too long'),
    description: z.string().max(4096).optional().nullable(),
    logo_url: z.string().url('Invalid URL').optional().nullable(),
    website: z.string().url('Invalid URL').optional().nullable(),
  }),
});

export type CreateCompanyDto = z.infer<typeof CreateCompanySchema>['body'];

export const UpdateCompanySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    title: z.string().max(256).optional(),
    description: z.string().max(4096).nullable().optional(),
    logo_url: z.string().url('Invalid URL').nullable().optional(),
    website: z.string().url('Invalid URL').nullable().optional(),
  }),
});

export type UpdateCompanyDto = z.infer<typeof UpdateCompanySchema>['body'];

export const CompanyListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    sort_by: z.enum(['created_at', 'title']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export interface CompanyResponse {
  id: number;
  title: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  avg_rating: number | null;
  total_reviews: number;
  total_services: number;
  created_at: Date;
}

export interface ServicePreviewItem {
  id: number;
  name: string;
  price: number;
  final_price: number;
  discount_percentage: number | null;
  is_published: boolean;
  categories: Array<{ id: number; title: string }>;
  avg_rating: number | null;
  total_reviews: number;
}

export interface CompanyDetailResponse extends CompanyResponse {
  owner: {
    id: number;
    first_name: string;
    last_name: string;
  };
  services_preview: ServicePreviewItem[];
}