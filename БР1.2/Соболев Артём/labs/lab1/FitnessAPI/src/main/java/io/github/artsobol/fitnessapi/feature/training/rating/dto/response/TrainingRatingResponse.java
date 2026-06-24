package io.github.artsobol.fitnessapi.feature.training.rating.dto.response;

import io.github.artsobol.fitnessapi.feature.user.dto.response.UserResponse;

import java.time.Instant;

public record TrainingRatingResponse(
        UserResponse user, int rating, String comment, Instant createdAt
) {
}
