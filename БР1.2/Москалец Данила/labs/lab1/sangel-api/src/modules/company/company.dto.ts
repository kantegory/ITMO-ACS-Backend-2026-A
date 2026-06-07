// src/modules/company/company.dto.ts
import { z } from 'zod';

// Create Company
export const CreateCompanySchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(256, 'Title too long'),
    description: z.string().max(4096).optional().nullable(),
    logo_url: z.string().url('Invalid URL').optional().nullable(),
    website: z.string().url('Invalid URL').optional().nullable(),
  }),
});

export type CreateCompanyDto = z.infer<typeof CreateCompanySchema>['body'];

// Update Company
export const UpdateCompanySchema = z.object({
  body: z.object({
    title: z.string().max(256).optional(),
    description: z.string().max(4096).nullable().optional(),
    logo_url: z.string().url('Invalid URL').nullable().optional(),
    website: z.string().url('Invalid URL').nullable().optional(),
  }),
});

export type UpdateCompanyDto = z.infer<typeof UpdateCompanySchema>['body'];

// Query params for companies list
export const CompanyListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    category_id: z.coerce.number().int().optional(),
    sort_by: z.enum(['created_at', 'rating', 'title']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export type CompanyListQuery = z.infer<typeof CompanyListQuerySchema>['query'];

// Company response (без внутренних полей)
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

// Service preview item
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

// Company detail response with owner and services preview
export interface CompanyDetailResponse extends CompanyResponse {
  owner: {
    id: number;
    first_name: string;
    last_name: string;
  };
  services_preview: ServicePreviewItem[];
}