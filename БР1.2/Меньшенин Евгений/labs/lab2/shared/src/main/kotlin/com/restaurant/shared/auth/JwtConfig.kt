package com.restaurant.shared.auth

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import java.util.Date

object JwtConfig {
    private const val EXPIRATION_MS = 3_600_000L
    private const val ISSUER = "restaurant-booking-api"
    const val REALM = "Restaurant Booking API"

    private val secret: String by lazy {
        System.getenv("JWT_SECRET")?.takeIf { it.isNotBlank() } ?: "dev-jwt-secret-change-in-production"
    }

    val verifier by lazy {
        JWT.require(Algorithm.HMAC256(secret))
            .withIssuer(ISSUER)
            .build()
    }

    fun generateToken(userId: Int, role: String): String =
        JWT.create()
            .withIssuer(ISSUER)
            .withClaim("userId", userId)
            .withClaim("role", role)
            .withExpiresAt(Date(System.currentTimeMillis() + EXPIRATION_MS))
            .sign(Algorithm.HMAC256(secret))

    fun userIdFromToken(token: String): Int? =
        runCatching { verifier.verify(token).getClaim("userId").asInt() }.getOrNull()

    fun roleFromToken(token: String): String? =
        runCatching { verifier.verify(token).getClaim("role").asString() }.getOrNull()
}
