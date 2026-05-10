package io.github.artsobol.blogservice.feature.article.comment.dto.response;

import java.time.Instant;

public record CommentResponse(
        Long id,
        String comment,
        Long userId,
        Instant createdAt,
        Instant updatedAt
) {
}
