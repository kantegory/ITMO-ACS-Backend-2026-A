package ru.itmo.restaurantbooking.auth.config

import org.springframework.boot.context.properties.ConfigurationProperties
import java.nio.charset.StandardCharsets

@ConfigurationProperties(prefix = "app.jwt")
data class JwtProperties(
    val issuer: String,
    val accessTokenTtlMinutes: Long,
    val secret: String
) {
    init {
        require(secret.toByteArray(StandardCharsets.UTF_8).size >= 32) {
            "JWT secret must contain at least 32 bytes for HS256"
        }
    }
}
