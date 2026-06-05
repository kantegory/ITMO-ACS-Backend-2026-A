package io.github.artsobol.progressservice.feature.training.rating.dto.response;

import java.time.Instant;

public record TrainingRatingResponse(
        Long trainingId,
        Long userId,
        int rating,
        String comment,
        Instant createdAt
) {
}
