package io.github.artsobol.fitnessapi.feature.training.session.service;

import io.github.artsobol.fitnessapi.feature.training.session.entity.TrainingSession;

public interface TrainingSessionFinder {

    TrainingSession findByIdOrThrow(Long id, Long userId);
}
