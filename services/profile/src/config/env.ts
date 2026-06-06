import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is required`);
  return v;
}

export const env = {
  port: parseInt(process.env.PORT || "3002", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: required("DATABASE_URL"),
  accessTokenSecret: required("ACCESS_TOKEN_SECRET"),
  authServiceUrl: required("AUTH_SERVICE_URL"),
  serviceToken: required("SERVICE_TOKEN"),
  rabbitmqUrl: required("RABBITMQ_URL"),
};

if (env.accessTokenSecret.length < 32) {
  throw new Error("ACCESS_TOKEN_SECRET must be at least 32 characters");
}
