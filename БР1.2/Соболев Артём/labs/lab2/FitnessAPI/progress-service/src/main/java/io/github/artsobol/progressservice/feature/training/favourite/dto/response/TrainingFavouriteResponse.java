package io.github.artsobol.progressservice.feature.training.favourite.dto.response;

import java.time.Instant;

public record TrainingFavouriteResponse(
        Long trainingId,
        Long userId,
        Instant createdAt
) {
}
