package ru.itmo.pxdkxvan.lab1.security

import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.JwsHeader
import org.springframework.security.oauth2.jwt.JwtClaimsSet
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.JwtEncoderParameters
import org.springframework.stereotype.Service
import ru.itmo.pxdkxvan.lab1.common.SystemRole
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@Service
class AccessTokenService(
    private val jwtEncoder: JwtEncoder,
    private val jwtProperties: JwtProperties,
) {
    fun generateToken(userId: UUID, email: String, roles: Set<SystemRole>): String {
        val issuedAt = Instant.now()
        val claims = JwtClaimsSet.builder()
            .subject(userId.toString())
            .issuedAt(issuedAt)
            .expiresAt(issuedAt.plus(jwtProperties.accessTtlMinutes, ChronoUnit.MINUTES))
            .claim("email", email)
            .claim("roles", roles.map(SystemRole::name).sorted())
            .build()

        return jwtEncoder.encode(
            JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                claims,
            ),
        ).tokenValue
    }
}
