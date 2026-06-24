package io.github.artsobol.fitnessapi.feature.training.sessionexercise.dto.response;

import io.github.artsobol.fitnessapi.feature.training.exercise.dto.response.TrainingExerciseResponse;
import io.github.artsobol.fitnessapi.feature.training.session.dto.response.TrainingSessionResponse;
import io.github.artsobol.fitnessapi.feature.training.sessionexercise.entity.ExerciseStatus;

import java.time.Instant;

public record TrainingSessionExerciseResponse(
        Long id,
        TrainingSessionResponse trainingSession,
        TrainingExerciseResponse trainingExercise,
        ExerciseStatus exerciseStatus,
        Instant completedAt
) {
}
