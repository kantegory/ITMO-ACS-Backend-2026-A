package io.github.artsobol.progressservice.integration.training.client;

import java.util.List;

public record RemoteTrainingResponse(
        Long id,
        List<RemoteTrainingExerciseResponse> exercises
) {
}
