package io.github.artsobol.trainingservice.integration.media.client;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.integration.media-service")
public record MediaServiceClientProperties(
        @NotBlank String baseUrl
) {
}
