package io.github.artsobol.progressservice.feature.training.sessionexercise.dto.response;

import io.github.artsobol.progressservice.feature.training.sessionexercise.entity.ExerciseStatus;

import java.time.Instant;

public record TrainingSessionExerciseResponse(
        Long id,
        Long trainingSessionId,
        Long trainingExerciseId,
        ExerciseStatus exerciseStatus,
        Instant completedAt
) {
}
