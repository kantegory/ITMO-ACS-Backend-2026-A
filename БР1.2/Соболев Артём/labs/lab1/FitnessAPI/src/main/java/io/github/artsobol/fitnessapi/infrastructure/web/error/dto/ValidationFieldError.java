package io.github.artsobol.fitnessapi.infrastructure.web.error.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Validation error for a specific field")
public record ValidationFieldError(

        @Schema(description = "Field name", example = "title")
        String field,

        @Schema(description = "Validation error message", example = "must not be blank")
        String message
) {
}