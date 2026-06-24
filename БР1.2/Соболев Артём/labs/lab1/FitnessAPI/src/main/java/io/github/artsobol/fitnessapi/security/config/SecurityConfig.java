package io.github.artsobol.fitnessapi.security.config;

import io.github.artsobol.fitnessapi.config.properties.security.JwtProperties;
import io.github.artsobol.fitnessapi.feature.auth.refreshtoken.service.RefreshTokenService;
import io.github.artsobol.fitnessapi.feature.user.repository.UserRepository;
import io.github.artsobol.fitnessapi.infrastructure.localization.MessageService;
import io.github.artsobol.fitnessapi.security.jwt.JwtAccessDeniedHandler;
import io.github.artsobol.fitnessapi.security.jwt.JwtAuthenticationEntryPoint;
import io.github.artsobol.fitnessapi.security.jwt.JwtAuthenticationFilter;
import io.github.artsobol.fitnessapi.security.jwt.JwtTokenProvider;
import io.github.artsobol.fitnessapi.security.user.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String[] PUBLIC_GET_ENDPOINTS = {
            "/articles",
            "/articles/*",
            "/articles/*/comments",
            "/categories",
            "/categories/*",
            "/exercises",
            "/exercises/*",
            "/profiles/*",
            "/tags",
            "/tags/*",
            "/trainings",
            "/trainings/*",
            "/training/*/ratings",
            "/types",
            "/types/*",
            "/videos/*",
            "/auth/password-reset/validate",
            "/auth/email-verification/validate"
    };

    private static final String[] PUBLIC_POST_ENDPOINTS = {
            "/auth/register",
            "/auth/login",
            "/auth/logout",
            "/auth/refresh",
            "/auth/password-reset",
            "/auth/password-reset/request",
            "/auth/email-verification"
    };

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            AuthenticationEntryPoint authenticationEntryPoint,
            AccessDeniedHandler accessDeniedHandler
    ) {
        http.csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**", "/error")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/profiles/me")
                        .authenticated()
                        .requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINTS)
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, PUBLIC_POST_ENDPOINTS)
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(ex -> ex.authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler));

        return http.build();
    }

    @Bean
    public JwtTokenProvider jwtTokenProvider(JwtProperties properties) {
        return new JwtTokenProvider(properties);
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(
            JwtTokenProvider provider,
            RefreshTokenService refreshTokenService
    ) {
        return new JwtAuthenticationFilter(provider, refreshTokenService);
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint(MessageService messageService, ObjectMapper objectMapper) {
        return new JwtAuthenticationEntryPoint(messageService, objectMapper);
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler(MessageService messageService, ObjectMapper objectMapper) {
        return new JwtAccessDeniedHandler(messageService, objectMapper);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return new UserDetailsServiceImpl(userRepository);
    }
}
