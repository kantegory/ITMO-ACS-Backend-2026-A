package io.github.artsobol.trainingservice.feature.training.training.service;

import io.github.artsobol.trainingservice.feature.training.training.entity.Training;

public interface TrainingFinder {

    Training findByIdOrThrow(Long id);
}
