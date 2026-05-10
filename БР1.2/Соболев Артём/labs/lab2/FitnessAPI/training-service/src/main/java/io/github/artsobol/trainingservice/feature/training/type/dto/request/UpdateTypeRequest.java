package io.github.artsobol.trainingservice.feature.training.type.dto.request;

import io.github.artsobol.common.infrastructure.validation.annotation.NullOrNotBlank;
import io.github.artsobol.common.infrastructure.validation.annotation.Slug;
import jakarta.validation.constraints.Size;

public record UpdateTypeRequest(
        @NullOrNotBlank(message = "{type.name.blank}")
        @Size(max = 30, message = "{type.name.size}")
        String name,
        @Slug
        @NullOrNotBlank(message = "{type.slug.blank}")
        @Size(max = 30, message = "{type.slug.size}")
        String slug
) {
}
