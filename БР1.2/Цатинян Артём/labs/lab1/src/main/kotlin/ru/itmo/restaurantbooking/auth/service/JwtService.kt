package ru.itmo.restaurantbooking.auth.service

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.auth.config.JwtProperties
import ru.itmo.restaurantbooking.auth.domain.AuthenticatedUser
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Date

@Service
class JwtService(
    private val jwtProperties: JwtProperties
) {

    private val key by lazy {
        Keys.hmacShaKeyFor(jwtProperties.secret.toByteArray(StandardCharsets.UTF_8))
    }

    fun generateToken(user: AuthenticatedUser): String {
        val now = Instant.now()

        return Jwts.builder()
            .subject(user.id.toString())
            .issuer(jwtProperties.issuer)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(jwtProperties.accessTokenTtlMinutes, ChronoUnit.MINUTES)))
            .claim("email", user.email)
            .claim("role", user.role.name)
            .signWith(key)
            .compact()
    }

    fun parse(token: String): AuthenticatedUser {
        val claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).payload
        return AuthenticatedUser(
            id = claims.subject.toLong(),
            email = claims["email", String::class.java],
            role = ru.itmo.restaurantbooking.user.domain.UserRole.valueOf(claims["role", String::class.java])
        )
    }
}
