import { z } from 'zod';

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: number;
    message: string;
    details?: Record<string, unknown>;
  };
}

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.number(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export function successResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

export function errorResponse(code: number, message: string, details?: Record<string, unknown>): ApiResponse<never> {
  return { error: { code, message, details } };
}