import 'dotenv/config';

const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value ? parsed : fallback;
};
const bool = (value: string | undefined, fallback: boolean): boolean =>
  value === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());

export const env = {
  service: 'user-service',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: num(process.env.PORT, 3001),
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: num(process.env.DB_PORT, 5432),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'lecters_users',
    synchronize: bool(process.env.DB_SYNCHRONIZE, true),
    logging: bool(process.env.DB_LOGGING, false),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'lecters-recipes-shared-secret',
    accessTtl: num(process.env.JWT_ACCESS_TTL, 3600),
    refreshTtl: num(process.env.JWT_REFRESH_TTL, 604800),
  },
  internalToken: process.env.INTERNAL_TOKEN ?? 'lecters-internal-token',
  rabbit: {
    url: process.env.RABBITMQ_URL ?? 'amqp://lecters:lecters@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE ?? 'recipes.events',
    enabled: bool(process.env.RABBITMQ_ENABLED, true),
  },
} as const;
