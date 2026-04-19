package io.github.artsobol.fitnessapi.feature.training.training.service;

import io.github.artsobol.fitnessapi.feature.training.training.entity.Training;

public interface TrainingFinder {

    Training findByIdOrThrow(Long id);
}
