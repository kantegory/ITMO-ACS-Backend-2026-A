package io.github.artsobol.fitnessapi.config.properties.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.security.password-reset-token")
public record PasswordResetTokenProperties(
        Duration ttl,
        String pepper,
        int length
) {
}
