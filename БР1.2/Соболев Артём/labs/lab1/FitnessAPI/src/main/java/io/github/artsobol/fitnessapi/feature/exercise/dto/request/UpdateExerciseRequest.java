package io.github.artsobol.fitnessapi.feature.exercise.dto.request;

import io.github.artsobol.fitnessapi.feature.exercise.entity.MuscleGroup;
import io.github.artsobol.fitnessapi.feature.training.training.entity.TrainingLevel;
import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.NullOrNotBlank;
import jakarta.validation.constraints.Size;

public record UpdateExerciseRequest(
        @NullOrNotBlank(message = "exercise.title.blank")
        @Size(max = 40, message = "{exercise.title.size}")
        String title,
        String description,
        MuscleGroup muscleGroup,
        TrainingLevel trainingLevel
) {
}
