import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3003", 10),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    user: process.env.DB_USER || "rental",
    password: process.env.DB_PASSWORD || "rental",
    name: process.env.DB_NAME || "rental",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret",
  },
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || "internal-shared-token",
  identityServiceUrl: process.env.IDENTITY_SERVICE_URL || "http://localhost:3001",
  propertyServiceUrl: process.env.PROPERTY_SERVICE_URL || "http://localhost:3002",
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://localhost",
};
