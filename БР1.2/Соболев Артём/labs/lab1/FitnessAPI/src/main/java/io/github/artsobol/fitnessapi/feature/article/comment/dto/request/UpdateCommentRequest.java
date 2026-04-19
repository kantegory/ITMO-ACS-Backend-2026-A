package io.github.artsobol.fitnessapi.feature.article.comment.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request for updating comment")
public record UpdateCommentRequest(
        @Schema(description = "Comment message", example = "Message")
        @NotBlank(message = "{comment.blank}")
        String comment
) {
}
