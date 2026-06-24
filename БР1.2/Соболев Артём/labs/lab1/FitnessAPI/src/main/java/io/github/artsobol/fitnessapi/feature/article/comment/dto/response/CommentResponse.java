package io.github.artsobol.fitnessapi.feature.article.comment.dto.response;

import io.github.artsobol.fitnessapi.feature.user.dto.response.UserResponse;

import java.time.Instant;

public record CommentResponse(
        Long id,
        String comment,
        UserResponse user,
        Instant createdAt,
        Instant updatedAt
) {
}
