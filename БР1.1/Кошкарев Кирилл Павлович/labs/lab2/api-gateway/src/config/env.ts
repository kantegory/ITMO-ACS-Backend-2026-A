import 'dotenv/config';

const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value ? parsed : fallback;
};

export const env = {
  service: 'api-gateway',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: num(process.env.PORT, 3000),
  jwt: { secret: process.env.JWT_SECRET ?? 'lecters-recipes-shared-secret' },
  internalToken: process.env.INTERNAL_TOKEN ?? 'lecters-internal-token',
  services: {
    user: process.env.USER_SERVICE_URL ?? 'http://localhost:3001',
    recipe: process.env.RECIPE_SERVICE_URL ?? 'http://localhost:3002',
    social: process.env.SOCIAL_SERVICE_URL ?? 'http://localhost:3003',
  },
  upstreamTimeoutMs: num(process.env.UPSTREAM_TIMEOUT_MS, 5000),
} as const;
