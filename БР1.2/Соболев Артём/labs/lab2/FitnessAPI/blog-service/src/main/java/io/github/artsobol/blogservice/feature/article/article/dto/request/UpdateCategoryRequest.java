package io.github.artsobol.blogservice.feature.article.article.dto.request;

import io.github.artsobol.common.infrastructure.validation.annotation.NullOrNotBlank;
import io.github.artsobol.common.infrastructure.validation.annotation.Slug;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

@Schema(description = "Request for updating category")
public record UpdateCategoryRequest(
        @Schema(description = "Category name", example = "Healthy")
        @NullOrNotBlank(message = "{category.name.blank}")
        String name,
        @Schema(description = "Category slug", example = "healthy")
        @Slug(message = "{category.slug.invalid}")
        @Size(max = 40, message = "{category.slug.size}")
        @NullOrNotBlank(message = "{category.slug.blank}")
        String slug
) {
}
