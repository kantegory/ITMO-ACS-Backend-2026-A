import "dotenv/config";

export const networkMode = (): "local" | "compose" => {
  const mode = process.env.APP_NETWORK_MODE ?? "local";
  if (mode !== "local" && mode !== "compose") throw new Error("APP_NETWORK_MODE must be local or compose");
  return mode;
};

export const listenHost = () => networkMode() === "compose" ? "0.0.0.0" : "127.0.0.1";

export const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}. Run npm run setup.`);
  return value;
};

export const port = (name: string, fallback: number): number => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`Invalid ${name}`);
  return value;
};

export const serviceUrl = (name: "ACCOUNTS" | "CATALOG" | "BOOKINGS" | "NOTIFICATIONS") => {
  const defaults = { ACCOUNTS: 8081, CATALOG: 8082, BOOKINGS: 8083, NOTIFICATIONS: 8084 };
  const url = new URL(process.env[`${name}_URL`] ?? `http://127.0.0.1:${port(`${name}_PORT`, defaults[name])}`);
  const host = networkMode() === "compose" ? name.toLowerCase() : "127.0.0.1";
  if (url.protocol !== "http:" || url.hostname !== host || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error(`${name}_URL must use http://${host}:PORT without credentials, path or query`);
  }
  return url.origin;
};
