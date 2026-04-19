package io.github.artsobol.fitnessapi.config.properties.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.security.refresh-token")
public record RefreshTokenProperties(
        Duration ttl,
        String pepper,
        int length
) {
}
