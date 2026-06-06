import type { z } from "zod";

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const parsed = schema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
