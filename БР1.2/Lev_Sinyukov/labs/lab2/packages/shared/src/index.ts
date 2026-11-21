export type ServiceHealth = {
  service: string;
  status: "ok";
  timestamp: string;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  trace_id: string;
  details?: Array<{ field: string; issue: string }>;
};

export const buildHealth = (service: string): ServiceHealth => ({
  service,
  status: "ok",
  timestamp: new Date().toISOString(),
});

export const buildError = (code: string, message: string): ApiErrorBody => ({
  code,
  message,
  trace_id: Math.random().toString(16).slice(2, 18),
});