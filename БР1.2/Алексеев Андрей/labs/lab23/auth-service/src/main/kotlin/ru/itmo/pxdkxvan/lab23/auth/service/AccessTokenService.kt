package ru.itmo.pxdkxvan.lab23.auth.service

import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.JwtClaimsSet
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.JwtEncoderParameters
import org.springframework.security.oauth2.jwt.JwsHeader
import org.springframework.stereotype.Service
import ru.itmo.pxdkxvan.lab23.auth.config.AuthProperties
import ru.itmo.pxdkxvan.lab23.auth.dto.AuthContextResponse
import java.time.Instant
import java.time.temporal.ChronoUnit

@Service
class AccessTokenService(
    private val jwtEncoder: JwtEncoder,
    private val authProperties: AuthProperties,
) {
    fun issue(user: AuthContextResponse): String {
        val issuedAt = Instant.now()
        val claims = JwtClaimsSet.builder()
            .subject(user.userId.toString())
            .issuedAt(issuedAt)
            .expiresAt(issuedAt.plus(authProperties.security.accessTtlMinutes, ChronoUnit.MINUTES))
            .claim("email", user.email)
            .claim("roles", user.roles.sorted())
            .build()

        val header = JwsHeader.with(MacAlgorithm.HS256).build()

        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).tokenValue
    }
}
