package io.github.artsobol.fitnessapi.feature.training.exercise.service;

import io.github.artsobol.fitnessapi.feature.training.exercise.entity.TrainingExercise;

public interface TrainingExerciseFinder {

    TrainingExercise findByIdOrThrow(Long id);
}
