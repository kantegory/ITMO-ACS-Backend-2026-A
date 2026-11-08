package com.mezhendosina.auth

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import java.util.Date

object JwtConfig {
    private const val EXPIRATION_MS = 300_000L
    private const val ISSUER = "restaurant-booking-api"
    const val REALM = "Restaurant Booking API"

    private val secret: String by lazy {
        System.getenv("JWT_SECRET")
            ?.takeIf { it.isNotBlank() }
            ?: error("JWT_SECRET environment variable is required")
    }

    val verifier by lazy {
        JWT.require(Algorithm.HMAC256(secret))
            .withIssuer(ISSUER)
            .build()
    }

    fun generateToken(userId: Int): String {
        return JWT.create()
            .withIssuer(ISSUER)
            .withClaim("userId", userId)
            .withExpiresAt(Date(System.currentTimeMillis() + EXPIRATION_MS))
            .sign(Algorithm.HMAC256(secret))
    }

    fun verifyToken(token: String): Int? {
        return try {
            val decoded = verifier.verify(token)
            decoded.getClaim("userId").asInt()
        } catch (e: Exception) {
            null
        }
    }
}
