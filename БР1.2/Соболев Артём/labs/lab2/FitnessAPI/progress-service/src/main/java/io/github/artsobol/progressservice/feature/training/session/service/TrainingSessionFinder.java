package io.github.artsobol.progressservice.feature.training.session.service;

import io.github.artsobol.progressservice.feature.training.session.entity.TrainingSession;

public interface TrainingSessionFinder {

    TrainingSession findByIdOrThrow(Long id, Long userId);
}
