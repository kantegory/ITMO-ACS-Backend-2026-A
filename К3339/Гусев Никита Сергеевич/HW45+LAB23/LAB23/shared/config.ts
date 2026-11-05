import "dotenv/config"

function getSecret(name: string) {

    const value = process.env[name]

    if (!value || value.length < 32) {
        throw new Error(name + " must contain at least 32 characters")
    }

    return value
}

export const JWT_SECRET = getSecret("JWT_SECRET")
export const INTERNAL_TOKEN = getSecret("INTERNAL_TOKEN")
export const RABBIT_URL = process.env.RABBIT_URL || "amqp://rabbitmq:5672"

export function databaseOptions(host: string, database: string) {

    if (!process.env.DB_PASSWORD) {
        throw new Error("DB_PASSWORD is required")
    }

    return {
        type: "postgres" as const,
        host: process.env.DB_HOST || host,
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || database,
        synchronize: process.env.DB_SYNCHRONIZE !== "false",
        logging: false
    }
}
