package io.github.artsobol.fitnessapi.feature.training.type.dto.request;

import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.Slug;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTypeRequest(
        @NotBlank(message = "{type.name.blank}")
        @Size(max = 30, message = "{type.name.size}")
        String name,
        @Slug
        @NotBlank(message = "{type.slug.blank}")
        @Size(max = 30, message = "{type.slug.size}")
        String slug
) {
}
