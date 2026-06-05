package io.github.artsobol.trainingservice.feature.training.exercise.service;

import io.github.artsobol.trainingservice.feature.training.exercise.entity.TrainingExercise;

public interface TrainingExerciseFinder {

    TrainingExercise findByIdOrThrow(Long id);
}
