package io.github.artsobol.fitnessapi.infrastructure.web.error.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Standard API error response")
public record ErrorResponse(

        @Schema(
                description = "Timestamp when the error occurred",
                example = "2026-04-12T23:30:00Z"
        )
        Instant timestamp,

        @Schema(
                description = "HTTP status code",
                example = "404"
        )
        int status,

        @Schema(
                description = "HTTP status reason",
                example = "Not Found"
        )
        String error,

        @Schema(
                description = "Application-specific error code",
                example = "RESOURCE_NOT_FOUND"
        )
        String errorCode,

        @Schema(
                description = "Human-readable error message",
                example = "Requested resource was not found"
        )
        String message,

        @Schema(
                description = "Request path that caused the error",
                example = "/api/v1/resources/1"
        )
        String path
) {
}
