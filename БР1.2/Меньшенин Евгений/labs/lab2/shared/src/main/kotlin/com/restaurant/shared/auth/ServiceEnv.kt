package com.restaurant.shared.auth

object ServiceEnv {
    val serviceToken: String
        get() = System.getenv("SERVICE_TOKEN")?.takeIf { it.isNotBlank() } ?: "dev-service-token"

    val redisUrl: String
        get() = System.getenv("REDIS_URL")?.takeIf { it.isNotBlank() } ?: "redis://localhost:6379"

    val serviceName: String
        get() = System.getenv("SERVICE_NAME") ?: "unknown"

    fun databaseUrl(default: String): String =
        System.getenv("DATABASE_URL")?.takeIf { it.isNotBlank() } ?: default

    fun urlEnv(name: String, default: String): String =
        System.getenv(name)?.takeIf { it.isNotBlank() } ?: default
}
