package io.github.artsobol.progressservice.integration.training.client;

public record RemoteTrainingExerciseResponse(
        Long id,
        Long exerciseId,
        int orderIndex
) {
}
