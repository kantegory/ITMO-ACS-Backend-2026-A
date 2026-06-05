package io.github.artsobol.trainingservice.feature.exercise.dto.request;

import io.github.artsobol.trainingservice.feature.exercise.entity.MuscleGroup;
import io.github.artsobol.trainingservice.feature.training.training.entity.TrainingLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateExerciseRequest(
        @NotBlank(message = "{exercise.title.blank}")
        @Size(max = 50, message = "{exercise.title.size}")
        String title,
        String description,
        @NotNull(message = "{exercise.muscle_group.null}")
        MuscleGroup muscleGroup,
        @NotNull(message = "{exercise.training_level.null}")
        TrainingLevel trainingLevel
) {
}
