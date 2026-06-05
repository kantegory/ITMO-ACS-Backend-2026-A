package io.github.artsobol.trainingservice.feature.exercise.service;

import io.github.artsobol.trainingservice.feature.exercise.entity.Exercise;

public interface ExerciseFinder {

    Exercise findByIdOrThrow(Long id);
}
