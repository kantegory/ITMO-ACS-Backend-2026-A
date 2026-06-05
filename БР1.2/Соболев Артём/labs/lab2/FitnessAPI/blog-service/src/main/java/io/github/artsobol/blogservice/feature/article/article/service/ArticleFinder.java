package io.github.artsobol.blogservice.feature.article.article.service;

import io.github.artsobol.blogservice.feature.article.article.entity.Article;

public interface ArticleFinder {

    Article findByIdOrThrow(Long id);
}
