package io.github.artsobol.fitnessapi.feature.training.tag.dto.request;

import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.Slug;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTagRequest(
        @NotBlank(message = "{tag.name.blank}")
        @Size(max = 30, message = "{tag.name.size}")
        String name,
        @Slug
        @NotBlank(message = "{tag.slug.blank}")
        @Size(max = 30, message = "{tag.slug.size}")
        String slug
) {
}
