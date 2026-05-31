package ru.itmo.pxdkxvan.lab23.gateway.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverter
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtGrantedAuthoritiesConverterAdapter
import org.springframework.security.web.server.SecurityWebFilterChain
import java.nio.charset.StandardCharsets
import javax.crypto.spec.SecretKeySpec

@Configuration
@EnableWebFluxSecurity
class SecurityConfig(
    private val properties: GatewayProperties,
) {
    @Bean
    fun securityWebFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain =
        http
            .csrf { it.disable() }
            .authorizeExchange {
                it
                    .pathMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    .pathMatchers(
                        "/auth-docs/v3/api-docs",
                        "/user-docs/v3/api-docs",
                        "/company-docs/v3/api-docs",
                        "/vacancy-docs/v3/api-docs",
                        "/search-docs/v3/api-docs",
                        "/resume-docs/v3/api-docs",
                        "/application-docs/v3/api-docs",
                        "/interaction-docs/v3/api-docs",
                        "/notification-docs/v3/api-docs",
                    ).permitAll()
                    .pathMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login", "/api/v1/auth/refresh").permitAll()
                    .pathMatchers(
                        HttpMethod.GET,
                        "/api/v1/vacancies",
                        "/api/v1/search/**",
                        "/api/v1/vacancies/*",
                        "/api/v1/companies/*",
                        "/api/v1/industries",
                        "/api/v1/experience-levels",
                    ).permitAll()
                    .anyExchange().authenticated()
            }
            .oauth2ResourceServer {
                it.jwt { spec ->
                    spec.jwtDecoder(
                        NimbusReactiveJwtDecoder.withSecretKey(
                            SecretKeySpec(properties.security.jwtSecret.toByteArray(StandardCharsets.UTF_8), "HmacSHA256"),
                        ).macAlgorithm(MacAlgorithm.HS256).build(),
                    )
                    spec.jwtAuthenticationConverter(jwtAuthenticationConverter())
                }
            }
            .build()

    private fun jwtAuthenticationConverter(): ReactiveJwtAuthenticationConverter {
        val authoritiesConverter = JwtGrantedAuthoritiesConverter().apply {
            setAuthoritiesClaimName("roles")
            setAuthorityPrefix("ROLE_")
        }
        return ReactiveJwtAuthenticationConverter().apply {
            setJwtGrantedAuthoritiesConverter(ReactiveJwtGrantedAuthoritiesConverterAdapter(authoritiesConverter))
        }
    }
}
