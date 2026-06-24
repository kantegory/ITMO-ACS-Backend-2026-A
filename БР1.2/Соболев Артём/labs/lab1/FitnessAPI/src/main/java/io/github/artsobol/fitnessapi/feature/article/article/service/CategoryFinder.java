package io.github.artsobol.fitnessapi.feature.article.article.service;

import io.github.artsobol.fitnessapi.feature.article.article.entity.Category;

public interface CategoryFinder {

    Category findByIdOrThrow(Long id);
}
