package io.github.artsobol.fitnessapi.feature.training.training.dto.request;

import io.github.artsobol.fitnessapi.feature.training.training.entity.TrainingLevel;
import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.NullOrNotBlank;
import jakarta.validation.constraints.Size;

public record UpdateTrainingRequest(
        @NullOrNotBlank(message = "{training.title.blank}")
        @Size(max = 50, message = "{training.title.size}")
        String title,
        String description,
        TrainingLevel trainingLevel
) {
}
