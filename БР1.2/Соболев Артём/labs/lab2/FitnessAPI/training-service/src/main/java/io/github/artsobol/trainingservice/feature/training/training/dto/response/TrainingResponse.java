package io.github.artsobol.trainingservice.feature.training.training.dto.response;

import io.github.artsobol.trainingservice.feature.training.exercise.dto.response.TrainingExerciseResponse;
import io.github.artsobol.trainingservice.feature.training.tag.dto.response.TagResponse;
import io.github.artsobol.trainingservice.feature.training.training.entity.TrainingLevel;
import io.github.artsobol.trainingservice.feature.training.type.dto.response.TypeResponse;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public record TrainingResponse(
        Long id,
        String title,
        String description,
        List<TrainingExerciseResponse> exercises,
        Long authorId,
        Set<TypeResponse> types,
        Set<TagResponse> tags,
        TrainingLevel trainingLevel,
        Instant createdAt,
        Instant updatedAt
) {
}
