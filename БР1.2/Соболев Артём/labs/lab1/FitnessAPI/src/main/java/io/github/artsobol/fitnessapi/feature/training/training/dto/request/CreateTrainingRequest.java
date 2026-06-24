package io.github.artsobol.fitnessapi.feature.training.training.dto.request;

import io.github.artsobol.fitnessapi.feature.training.training.entity.TrainingLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTrainingRequest(
        @NotBlank(message = "{training.title.blank}")
        @Size(max = 50, message = "{training.title.size}")
        String title,
        String description,
        @NotNull(message = "{training.training_level.null}")
        TrainingLevel trainingLevel
) {
}
