package io.github.artsobol.fitnessapi.feature.training.rating.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateTrainingRatingRequest(
        @Min(value = 1, message = "{training.rating.min}")
        @Max(value = 5, message = "{training.rating.max}")
        Integer rating,
        String comment
) {
}
