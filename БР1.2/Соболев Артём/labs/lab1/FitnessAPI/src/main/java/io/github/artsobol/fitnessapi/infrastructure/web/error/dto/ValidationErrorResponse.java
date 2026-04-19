package io.github.artsobol.fitnessapi.infrastructure.web.error.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "Standard API validation error response")
public record ValidationErrorResponse(
        @Schema(
                description = "Timestamp when the error occurred",
                example = "2026-04-12T23:30:00Z"
        )
        Instant timestamp,

        @Schema(
                description = "HTTP status code",
                example = "400"
        )
        int status,

        @Schema(
                description = "HTTP status reason",
                example = "Bad request"
        )
        String error,

        @Schema(
                description = "Human-readable error message",
                example = "Invalid request body"
        )
        String message,

        @Schema(
                description = "Request path that caused the error",
                example = "/api/v1/resources/1"
        )
        String path,
        @Schema(
                description = "List of validation errors for specific fields"
        )
        List<ValidationFieldError> errors
) {
}
