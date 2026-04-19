package io.github.artsobol.fitnessapi.feature.training.exercise.dto.response;

import io.github.artsobol.fitnessapi.feature.exercise.dto.response.ExerciseResponse;

public record TrainingExerciseResponse(
        Long id,
        ExerciseResponse exercise,
        int orderIndex
) {
}
