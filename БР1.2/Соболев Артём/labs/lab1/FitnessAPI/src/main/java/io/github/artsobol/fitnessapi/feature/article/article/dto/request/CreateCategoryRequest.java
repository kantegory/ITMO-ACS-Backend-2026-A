package io.github.artsobol.fitnessapi.feature.article.article.dto.request;

import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.Slug;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request for creating category")
public record CreateCategoryRequest(
        @Schema(description = "Category name", example = "Healthy")
        @NotBlank(message = "{category.name.blank}")
        @Size(max = 40, message = "{category.name.size}")
        String name,
        @Schema(description = "Category slug", example = "healthy")
        @Slug(message = "{category.slug.invalid}")
        @NotBlank(message = "{category.slug.blank}")
        @Size(max = 40, message = "{category.slug.size}")
        String slug
) {
}
