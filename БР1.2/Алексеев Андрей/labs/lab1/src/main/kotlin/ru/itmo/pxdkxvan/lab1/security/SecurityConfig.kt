package ru.itmo.pxdkxvan.lab1.security

import com.fasterxml.jackson.databind.ObjectMapper
import com.nimbusds.jose.jwk.source.ImmutableSecret
import jakarta.servlet.http.HttpServletResponse
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter
import org.springframework.security.web.SecurityFilterChain
import ru.itmo.pxdkxvan.lab1.common.ApiErrorCode
import ru.itmo.pxdkxvan.lab1.common.ErrorResponse
import java.nio.charset.StandardCharsets
import javax.crypto.spec.SecretKeySpec

@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties(JwtProperties::class)
class SecurityConfig(
    private val objectMapper: ObjectMapper,
    private val jwtProperties: JwtProperties,
) {
    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it
                    .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/auth/register", "/auth/login").permitAll()
                    .requestMatchers(HttpMethod.GET, "/vacancies", "/industries", "/experience-levels", "/skills").permitAll()
                    .requestMatchers(HttpMethod.GET, "/companies/*").permitAll()
                    .requestMatchers(HttpMethod.GET, "/vacancies/*").permitAll()
                    .requestMatchers(HttpMethod.POST, "/vacancies/*/applications").hasRole("APPLICANT")
                    .requestMatchers(HttpMethod.GET, "/vacancies/history", "/vacancies/favorites", "/applications/my").hasRole("APPLICANT")
                    .requestMatchers(HttpMethod.POST, "/vacancies/history/*", "/vacancies/favorites/*").hasRole("APPLICANT")
                    .requestMatchers(HttpMethod.DELETE, "/vacancies/favorites/*").hasRole("APPLICANT")
                    .requestMatchers(HttpMethod.GET, "/vacancies/*/applications").hasRole("EMPLOYER")
                    .requestMatchers(HttpMethod.GET, "/vacancies/*/assignments").hasRole("EMPLOYER")
                    .requestMatchers(HttpMethod.POST, "/vacancies/*/assignments").hasRole("EMPLOYER")
                    .requestMatchers(HttpMethod.PATCH, "/vacancy-assignments/*", "/applications/*/status").hasRole("EMPLOYER")
                    .requestMatchers(HttpMethod.DELETE, "/vacancy-assignments/*", "/vacancies/*").hasRole("EMPLOYER")
                    .requestMatchers(HttpMethod.GET, "/roles").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/roles", "/users/*/roles").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/industries", "/experience-levels", "/skills").hasAnyRole("ADMIN", "DICTIONARY_EDITOR")
                    .requestMatchers(HttpMethod.PATCH, "/industries/*", "/experience-levels/*", "/skills/*").hasAnyRole("ADMIN", "DICTIONARY_EDITOR")
                    .requestMatchers("/companies/**", "/employer-profiles/**", "/vacancies/**").hasRole("EMPLOYER")
                    .requestMatchers("/resumes/**").hasRole("APPLICANT")
                    .anyRequest().authenticated()
            }
            .oauth2ResourceServer {
                it.jwt { jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()) }
            }
            .exceptionHandling {
                it.authenticationEntryPoint { _, response, _ ->
                    writeError(response.status(HttpStatus.UNAUTHORIZED), ErrorResponse(ApiErrorCode.UNAUTHORIZED, "Authentication required"))
                }
                it.accessDeniedHandler { _, response, _ ->
                    writeError(response.status(HttpStatus.FORBIDDEN), ErrorResponse(ApiErrorCode.FORBIDDEN, "Access denied"))
                }
            }

        return http.build()
    }

    @Bean
    fun jwtDecoder(): JwtDecoder = NimbusJwtDecoder.withSecretKey(secretKey()).macAlgorithm(MacAlgorithm.HS256).build()

    @Bean
    fun jwtEncoder(): JwtEncoder = NimbusJwtEncoder(ImmutableSecret(secretKey()))

    private fun jwtAuthenticationConverter(): JwtAuthenticationConverter {
        val authoritiesConverter = JwtGrantedAuthoritiesConverter().apply {
            setAuthoritiesClaimName("roles")
            setAuthorityPrefix("ROLE_")
        }
        return JwtAuthenticationConverter().apply {
            setJwtGrantedAuthoritiesConverter(authoritiesConverter)
            setPrincipalClaimName("sub")
        }
    }

    private fun secretKey() = SecretKeySpec(jwtProperties.secret.toByteArray(StandardCharsets.UTF_8), "HmacSHA256")

    private fun HttpServletResponse.status(status: HttpStatus): HttpServletResponse {
        this.status = status.value()
        contentType = "application/json"
        characterEncoding = "UTF-8"
        return this
    }

    private fun writeError(response: HttpServletResponse, body: ErrorResponse) {
        response.writer.write(objectMapper.writeValueAsString(body))
    }
}
