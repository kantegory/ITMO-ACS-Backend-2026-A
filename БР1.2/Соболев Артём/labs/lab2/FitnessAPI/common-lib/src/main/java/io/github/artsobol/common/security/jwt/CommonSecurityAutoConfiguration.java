package io.github.artsobol.common.security.jwt;

import io.github.artsobol.common.config.properties.security.JwtProperties;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import tools.jackson.databind.ObjectMapper;

@AutoConfiguration(afterName = "org.springframework.boot.jackson.autoconfigure.JacksonAutoConfiguration")
@ConditionalOnClass(AuthenticationEntryPoint.class)
public class CommonSecurityAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public JwtTokenProvider jwtTokenProvider(JwtProperties properties) {
        return new JwtTokenProvider(properties);
    }

    @Bean
    @ConditionalOnMissingBean
    public JwtSessionValidator jwtSessionValidator() {
        return new NoOpJwtSessionValidator();
    }

    @Bean
    @ConditionalOnMissingBean
    public JwtAuthenticationFilter jwtAuthenticationFilter(
            JwtTokenProvider jwtTokenProvider,
            JwtSessionValidator jwtSessionValidator
    ) {
        return new JwtAuthenticationFilter(jwtTokenProvider, jwtSessionValidator);
    }

    @Bean
    @ConditionalOnMissingBean(AuthenticationEntryPoint.class)
    public AuthenticationEntryPoint authenticationEntryPoint(
            MessageSource messageSource,
            ObjectMapper objectMapper
    ) {
        return new JwtAuthenticationEntryPoint(messageSource, objectMapper);
    }

    @Bean
    @ConditionalOnMissingBean(AccessDeniedHandler.class)
    public AccessDeniedHandler accessDeniedHandler(
            MessageSource messageSource,
            ObjectMapper objectMapper
    ) {
        return new JwtAccessDeniedHandler(messageSource, objectMapper);
    }
}
