package io.github.artsobol.progressservice.feature.training.session.dto.response;

import io.github.artsobol.progressservice.feature.training.session.entity.TrainingStatus;

import java.time.Instant;

public record TrainingSessionResponse(
        Long id,
        Long userId,
        Long trainingId,
        TrainingStatus trainingStatus,
        Instant startedAt,
        Instant completedAt
) {
}
