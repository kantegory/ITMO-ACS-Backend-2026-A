export const apiError = (code: string, message: string, details?: unknown) => ({
  code,
  message,
  details,
});
