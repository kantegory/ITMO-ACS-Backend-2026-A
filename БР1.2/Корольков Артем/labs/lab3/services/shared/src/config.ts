export function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    throw new Error(`Не задана переменная окружения ${name}`);
  }

  return value;
}

export const JWT_SECRET = requiredEnv('JWT_SECRET');
export const SERVICE_KEY = requiredEnv('SERVICE_KEY');

export const AUTH_SERVICE_URL = requiredEnv('AUTH_SERVICE_URL');
export const RESTAURANT_SERVICE_URL = requiredEnv('RESTAURANT_SERVICE_URL');
export const RESERVATION_SERVICE_URL = requiredEnv('RESERVATION_SERVICE_URL');

export const RABBITMQ_ENABLED = requiredEnv('RABBITMQ_ENABLED') === 'true';