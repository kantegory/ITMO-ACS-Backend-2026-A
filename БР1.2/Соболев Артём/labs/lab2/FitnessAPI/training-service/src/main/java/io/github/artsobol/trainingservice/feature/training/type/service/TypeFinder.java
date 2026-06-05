package io.github.artsobol.trainingservice.feature.training.type.service;

import io.github.artsobol.trainingservice.feature.training.type.entity.Type;

public interface TypeFinder {

    Type findBySlugOrThrow(String slug);
}
