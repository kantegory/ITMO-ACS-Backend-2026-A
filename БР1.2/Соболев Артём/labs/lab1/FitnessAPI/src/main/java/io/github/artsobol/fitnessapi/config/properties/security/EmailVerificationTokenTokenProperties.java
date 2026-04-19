package io.github.artsobol.fitnessapi.config.properties.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.security.email-verification-token")
public record EmailVerificationTokenTokenProperties(
        Duration ttl,
        String pepper,
        int length
) {
}
