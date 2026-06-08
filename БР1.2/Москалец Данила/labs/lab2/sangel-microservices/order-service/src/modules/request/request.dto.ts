import { z } from 'zod';

// Create Request
export const CreateRequestSchema = z.object({
  params: z.object({
    service_id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    description: z.string().max(2048).optional().nullable(),
  }),
});

export type CreateRequestDto = z.infer<typeof CreateRequestSchema>['body'];

// Update Request Status
export const UpdateRequestStatusSchema = z.object({
  params: z.object({
    request_id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    status: z.enum(['ACCEPTED', 'REJECTED']),
    reply: z.string().max(2048).optional().nullable(),
  }),
});

export type UpdateRequestStatusDto = z.infer<typeof UpdateRequestStatusSchema>['body'];

// List Requests Query
export const RequestListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']).optional(),
    sort_by: z.enum(['created_at', 'status']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export type RequestListQuery = z.infer<typeof RequestListQuerySchema>['query'];

export interface RequestResponse {
  id: number;
  service: {
    id: number;
    name: string;
    company: {
      id: number;
      title: string;
    };
  };
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
  status: string;
  description: string | null;
  reply: string | null;
  created_at: Date;
  updated_at: Date;
}