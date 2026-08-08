import 'dotenv/config';

export function envString(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

export function envInt(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }
  return value;
}

export interface DatabaseEnv {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export function databaseEnv(prefix: string): DatabaseEnv {
  return {
    host: envString('DB_HOST', 'localhost'),
    port: envInt('DB_PORT', 15432),
    database: envString(`${prefix}_DB_NAME`),
    username: envString(`${prefix}_DB_USER`),
    password: envString(`${prefix}_DB_PASSWORD`),
  };
}

export const SERVICE_TOKEN = envString('SERVICE_TOKEN', 'fitness-service-token');
export const GATEWAY_TOKEN = envString('GATEWAY_TOKEN', 'fitness-gateway-token');
