package io.github.artsobol.fitnessapi.feature.article.article.dto.request;

import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.NullOrNotBlank;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

@Schema(description = "Request for partially updating article")
public record UpdateArticleRequest(
        @Schema(description = "Article title", example = "Healthy food")
        @NullOrNotBlank(message = "{article.title.blank}")
        @Size(max = 100, message = "{article.title.size}")
        String title,

        @Schema(description = "Article description", example = "Description of the article content")
        String description
) {
}
