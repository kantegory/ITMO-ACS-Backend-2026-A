package io.github.artsobol.trainingservice.feature.exercise.dto.request;

import io.github.artsobol.trainingservice.feature.exercise.entity.MuscleGroup;
import io.github.artsobol.trainingservice.feature.training.training.entity.TrainingLevel;
import io.github.artsobol.common.infrastructure.validation.annotation.NullOrNotBlank;
import jakarta.validation.constraints.Size;

public record UpdateExerciseRequest(
        @NullOrNotBlank(message = "{exercise.title.blank}")
        @Size(max = 50, message = "{exercise.title.size}")
        String title,
        String description,
        MuscleGroup muscleGroup,
        TrainingLevel trainingLevel
) {
}
