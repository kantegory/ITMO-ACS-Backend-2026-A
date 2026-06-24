package io.github.artsobol.fitnessapi.feature.training.training.dto.response;

import io.github.artsobol.fitnessapi.feature.training.exercise.dto.response.TrainingExerciseResponse;
import io.github.artsobol.fitnessapi.feature.training.tag.dto.response.TagResponse;
import io.github.artsobol.fitnessapi.feature.training.training.entity.TrainingLevel;
import io.github.artsobol.fitnessapi.feature.training.type.dto.response.TypeResponse;
import io.github.artsobol.fitnessapi.feature.user.dto.response.UserResponse;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public record TrainingResponse(
        Long id,
        String title,
        String description,
        List<TrainingExerciseResponse> exercises,
        UserResponse author,
        Set<TypeResponse> types,
        Set<TagResponse> tags,
        TrainingLevel trainingLevel,
        Instant createdAt,
        Instant updatedAt
) {
}
