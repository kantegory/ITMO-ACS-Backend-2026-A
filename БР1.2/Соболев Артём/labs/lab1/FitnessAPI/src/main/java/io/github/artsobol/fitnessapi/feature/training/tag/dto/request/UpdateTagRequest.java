package io.github.artsobol.fitnessapi.feature.training.tag.dto.request;

import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.NullOrNotBlank;
import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.Slug;
import jakarta.validation.constraints.Size;

public record UpdateTagRequest(
        @NullOrNotBlank(message = "{tag.name.blank}")
        @Size(max = 30, message = "{tag.name.size}")
        String name,
        @Slug
        @Size(max = 30, message = "{tag.slug.size}")
        @NullOrNotBlank(message = "{tag.slug.blank}")
        String slug
) {
}
