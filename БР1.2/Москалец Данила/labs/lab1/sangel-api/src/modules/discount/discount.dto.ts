import { z } from 'zod';

// Create/Update Discount
export const DiscountSchema = z.object({
  body: z.object({
    percentage: z.number().int().min(1, 'Percentage must be between 1 and 99').max(99),
    start_at: z.string().datetime({ offset: true }),
    end_at: z.string().datetime({ offset: true }),
  }).refine((data) => new Date(data.start_at) < new Date(data.end_at), {
    message: 'start_at must be before end_at',
    path: ['start_at'],
  }),
});

export type DiscountDto = z.infer<typeof DiscountSchema>['body'];

export interface DiscountResponse {
  id: number;
  service_id: number;
  percentage: number;
  start_at: Date;
  end_at: Date;
  is_active: boolean;
}