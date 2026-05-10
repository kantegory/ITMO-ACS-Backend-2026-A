package io.github.artsobol.trainingservice.feature.exercise.dto.response;

import io.github.artsobol.trainingservice.feature.exercise.entity.MuscleGroup;
import io.github.artsobol.trainingservice.feature.training.training.entity.TrainingLevel;

import java.time.Instant;
import java.util.Set;

public record ExerciseResponse(
        Long id,
        String title,
        String description,
        Set<Long> videoIds,
        MuscleGroup muscleGroup,
        TrainingLevel trainingLevel,
        Long authorId,
        Instant createdAt,
        Instant updatedAt
) {
}
