package io.github.artsobol.progressservice.integration.training.projection;

public record TrainingCatalogExerciseSnapshot(
        Long trainingExerciseId,
        Long exerciseId,
        int orderIndex
) {
}
