import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    user: process.env.DB_USER || "rental",
    password: process.env.DB_PASSWORD || "rental",
    name: process.env.DB_NAME || "identity",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret",
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || "3600", 10),
  },
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || "internal-shared-token",
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://localhost",
};
