package io.github.artsobol.fitnessapi.config.properties.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.session")
public record SessionProperties(
        long maxSessions
) {
}
