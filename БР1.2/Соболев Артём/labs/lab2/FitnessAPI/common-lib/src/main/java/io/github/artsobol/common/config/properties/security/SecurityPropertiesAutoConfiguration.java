package io.github.artsobol.common.config.properties.security;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@AutoConfiguration
@EnableConfigurationProperties({
        CookieProperties.class,
        JwtProperties.class,
        RefreshTokenProperties.class,
        SessionProperties.class
})
public class SecurityPropertiesAutoConfiguration {
}
