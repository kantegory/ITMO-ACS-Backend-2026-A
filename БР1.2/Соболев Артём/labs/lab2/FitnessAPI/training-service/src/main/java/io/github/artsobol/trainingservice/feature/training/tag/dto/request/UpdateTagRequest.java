package io.github.artsobol.trainingservice.feature.training.tag.dto.request;

import io.github.artsobol.common.infrastructure.validation.annotation.NullOrNotBlank;
import io.github.artsobol.common.infrastructure.validation.annotation.Slug;
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
