package io.github.artsobol.common.messaging.training;

public record TrainingCatalogExerciseEvent(
        Long trainingExerciseId,
        Long exerciseId,
        int orderIndex
) {
}
