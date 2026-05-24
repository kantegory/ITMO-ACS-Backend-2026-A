package ru.itmo.restaurantbooking.lab2.identity.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.lab2.common.exception.UnauthorizedException
import ru.itmo.restaurantbooking.lab2.identity.config.JwtProperties
import ru.itmo.restaurantbooking.lab2.identity.domain.UserRecord
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

@Service
class JwtTokenService(
    private val jwtProperties: JwtProperties,
    private val objectMapper: ObjectMapper
) {
    private val encoder = Base64.getUrlEncoder().withoutPadding()
    private val decoder = Base64.getUrlDecoder()

    fun issue(user: UserRecord): String {
        val now = Instant.now().epochSecond
        val header = mapOf("alg" to "HS256", "typ" to "JWT")
        val payload = mapOf(
            "sub" to user.id.toString(),
            "email" to user.email,
            "role" to user.role,
            "iat" to now,
            "exp" to now + jwtProperties.ttlSeconds
        )

        val headerPart = encodeJson(header)
        val payloadPart = encodeJson(payload)
        val signaturePart = sign("$headerPart.$payloadPart")

        return "$headerPart.$payloadPart.$signaturePart"
    }

    fun validate(token: String): TokenClaims {
        val parts = token.split(".")
        if (parts.size != 3) {
            throw UnauthorizedException("Invalid access token")
        }

        val unsignedToken = "${parts[0]}.${parts[1]}"
        if (sign(unsignedToken) != parts[2]) {
            throw UnauthorizedException("Invalid access token")
        }

        val payload = objectMapper.readValue(
            decoder.decode(parts[1]).toString(StandardCharsets.UTF_8),
            Map::class.java
        )

        val expiresAt = (payload["exp"] as Number).toLong()
        if (expiresAt < Instant.now().epochSecond) {
            throw UnauthorizedException("Access token expired")
        }

        return TokenClaims(
            userId = payload["sub"].toString().toLong(),
            email = payload["email"].toString(),
            role = payload["role"].toString()
        )
    }

    private fun encodeJson(value: Map<String, Any>): String =
        encoder.encodeToString(objectMapper.writeValueAsBytes(value))

    private fun sign(value: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(jwtProperties.secret.toByteArray(StandardCharsets.UTF_8), "HmacSHA256"))
        return encoder.encodeToString(mac.doFinal(value.toByteArray(StandardCharsets.UTF_8)))
    }
}

data class TokenClaims(
    val userId: Long,
    val email: String,
    val role: String
)
