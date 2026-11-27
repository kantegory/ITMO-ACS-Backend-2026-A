export function parseIdParam(value: unknown, paramName: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${paramName} must be a positive integer`);
  }

  return parsed;
}