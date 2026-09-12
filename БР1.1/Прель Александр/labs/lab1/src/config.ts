import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 8080),
  databasePath: process.env.DATABASE_PATH ?? "./data/restaurant-booking.sqlite",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
};
