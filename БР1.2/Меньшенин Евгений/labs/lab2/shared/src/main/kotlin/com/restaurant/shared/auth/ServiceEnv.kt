package com.restaurant.shared.auth

object ServiceEnv {
    val serviceToken: String
        get() = System.getenv("SERVICE_TOKEN")?.takeIf { it.isNotBlank() } ?: "dev-service-token"

    val kafkaBootstrapServers: String
        get() = System.getenv("KAFKA_BOOTSTRAP_SERVERS")?.takeIf { it.isNotBlank() } ?: "localhost:9092"

    val serviceName: String
        get() = System.getenv("SERVICE_NAME") ?: "unknown"

    fun databaseUrl(default: String): String =
        System.getenv("DATABASE_URL")?.takeIf { it.isNotBlank() } ?: default

    fun urlEnv(name: String, default: String): String =
        System.getenv(name)?.takeIf { it.isNotBlank() } ?: default
}
