package io.github.artsobol.fitnessapi.config.properties.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.security.cookie")
public record CookieProperties(
        boolean secure,
        Duration maxAge,
        String sameSite,
        String cookieName,
        String path
) {
}
