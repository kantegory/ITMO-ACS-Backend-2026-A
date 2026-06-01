export const apiError = (code: string, message: string, details?: unknown) => ({
  code,
  message,
  details,
});

export function assertInternal(headers: Record<string, string | undefined>): boolean {
  return headers["x-internal-secret"] === process.env.INTERNAL_SECRET;
}
