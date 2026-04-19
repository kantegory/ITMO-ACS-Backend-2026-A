package io.github.artsobol.fitnessapi.feature.training.favourite.dto.response;

import io.github.artsobol.fitnessapi.feature.training.training.dto.response.TrainingResponse;

import java.time.Instant;

public record TrainingFavouriteResponse(
        TrainingResponse training, Instant createdAt
) {
}
