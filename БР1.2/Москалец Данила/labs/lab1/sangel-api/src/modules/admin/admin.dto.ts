import { z } from 'zod';

// Activity Report Query
export const ActivityReportQuerySchema = z.object({
  query: z.object({
    period: z.enum(['day', 'week', 'month']).default('month'),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export type ActivityReportQuery = z.infer<typeof ActivityReportQuerySchema>['query'];

// Company Report Query
export const CompanyReportQuerySchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export type CompanyReportQuery = z.infer<typeof CompanyReportQuerySchema>['query'];

// Activity Report Response
export interface ActivityReportResponse {
  period: {
    from: string;
    to: string;
  };
  totals: {
    users: number;
    companies: number;
    services: number;
    requests: number;
    reviews: number;
  };
  requests_by_status: {
    pending: number;
    accepted: number;
    rejected: number;
    cancelled: number;
  };
  top_companies: Array<{
    id: number;
    title: string;
    requests_accepted: number;
    avg_rating: number | null;
  }>;
  new_users_dynamics: Array<{
    date: string;
    count: number;
  }>;
}

// Company Report Response
export interface CompanyReportResponse {
  company_id: number;
  period: {
    from: string;
    to: string;
  };
  requests_total: number;
  requests_by_status: {
    pending: number;
    accepted: number;
    rejected: number;
    cancelled: number;
  };
  top_services: Array<{
    service_id: number;
    name: string;
    requests_count: number;
    avg_rating: number | null;
  }>;
  avg_rating: number | null;
  total_reviews: number;
}

// User List Query
export const UserListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    role: z.enum(['ADMIN', 'USER', 'OWNER']).optional(),
    sort_by: z.enum(['created_at', 'email']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export type UserListQuery = z.infer<typeof UserListQuerySchema>['query'];