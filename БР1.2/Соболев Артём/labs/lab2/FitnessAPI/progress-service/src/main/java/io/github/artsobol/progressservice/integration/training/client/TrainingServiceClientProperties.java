package io.github.artsobol.progressservice.integration.training.client;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.integration.training-service")
public record TrainingServiceClientProperties(
        @NotBlank String baseUrl
) {
}
