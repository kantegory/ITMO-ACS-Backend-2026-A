package io.github.artsobol.fitnessapi.feature.training.type.service;

import io.github.artsobol.fitnessapi.feature.training.type.entity.Type;

public interface TypeFinder {

    Type findBySlugOrThrow(String slug);
}
