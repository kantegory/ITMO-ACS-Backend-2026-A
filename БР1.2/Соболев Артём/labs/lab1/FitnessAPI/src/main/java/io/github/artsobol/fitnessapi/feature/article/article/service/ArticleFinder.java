package io.github.artsobol.fitnessapi.feature.article.article.service;

import io.github.artsobol.fitnessapi.feature.article.article.entity.Article;

public interface ArticleFinder {

    Article findByIdOrThrow(Long id);
}
