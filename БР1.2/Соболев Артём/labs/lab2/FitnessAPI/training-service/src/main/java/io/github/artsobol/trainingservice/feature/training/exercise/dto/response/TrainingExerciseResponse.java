package io.github.artsobol.trainingservice.feature.training.exercise.dto.response;

public record TrainingExerciseResponse(
        Long id,
        Long exerciseId,
        int orderIndex
) {
}
