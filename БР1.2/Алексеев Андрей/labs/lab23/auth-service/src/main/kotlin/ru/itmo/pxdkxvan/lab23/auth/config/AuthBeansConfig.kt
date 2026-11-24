package ru.itmo.pxdkxvan.lab23.auth.config

import com.nimbusds.jose.jwk.source.ImmutableSecret
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder
import java.nio.charset.StandardCharsets
import javax.crypto.spec.SecretKeySpec

@Configuration
class AuthBeansConfig(
    private val authProperties: AuthProperties,
) {
    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun jwtEncoder(): JwtEncoder =
        NimbusJwtEncoder(
            ImmutableSecret(
                SecretKeySpec(
                    authProperties.security.jwtSecret.toByteArray(StandardCharsets.UTF_8),
                    "HmacSHA256",
                ),
            ),
        )
}
