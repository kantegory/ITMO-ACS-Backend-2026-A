package io.github.artsobol.fitnessapi.feature.exercise.service;

import io.github.artsobol.fitnessapi.feature.exercise.entity.Exercise;

public interface ExerciseFinder {

    Exercise findByIdOrThrow(Long id);
}
