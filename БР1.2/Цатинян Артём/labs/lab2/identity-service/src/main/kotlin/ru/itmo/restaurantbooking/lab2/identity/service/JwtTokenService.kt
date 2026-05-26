package ru.itmo.restaurantbooking.lab2.identity.service

import com.nimbusds.jose.jwk.source.ImmutableSecret
import org.springframework.stereotype.Service
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.JwtClaimsSet
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.JwtEncoderParameters
import org.springframework.security.oauth2.jwt.JwtException
import org.springframework.security.oauth2.jwt.JwsHeader
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder
import ru.itmo.restaurantbooking.lab2.common.exception.UnauthorizedException
import ru.itmo.restaurantbooking.lab2.identity.config.JwtProperties
import ru.itmo.restaurantbooking.lab2.identity.domain.UserRecord
import java.nio.charset.StandardCharsets
import java.time.Instant
import javax.crypto.spec.SecretKeySpec

@Service
class JwtTokenService(
    private val jwtProperties: JwtProperties
) {
    private val secretKey = SecretKeySpec(
        jwtProperties.secret.toByteArray(StandardCharsets.UTF_8),
        "HmacSHA256"
    )
    private val jwtEncoder: JwtEncoder = NimbusJwtEncoder(ImmutableSecret(secretKey))
    private val jwtDecoder: JwtDecoder = NimbusJwtDecoder
        .withSecretKey(secretKey)
        .macAlgorithm(MacAlgorithm.HS256)
        .build()

    fun issue(user: UserRecord): String {
        val now = Instant.now()
        val header = JwsHeader.with(MacAlgorithm.HS256).build()
        val claims = JwtClaimsSet.builder()
            .subject(user.id.toString())
            .claim("email", user.email)
            .claim("role", user.role)
            .issuedAt(now)
            .expiresAt(now.plusSeconds(jwtProperties.ttlSeconds))
            .build()

        return jwtEncoder.encode(
            JwtEncoderParameters.from(header, claims)
        ).tokenValue
    }

    fun validate(token: String): TokenClaims =
        try {
            val jwt = jwtDecoder.decode(token)
            TokenClaims(
                userId = jwt.subject.toLong(),
                email = jwt.getClaimAsString("email"),
                role = jwt.getClaimAsString("role")
            )
        } catch (exception: JwtException) {
            throw UnauthorizedException("Invalid access token")
        } catch (exception: IllegalArgumentException) {
            throw UnauthorizedException("Invalid access token")
        }
}

data class TokenClaims(
    val userId: Long,
    val email: String,
    val role: String
)
