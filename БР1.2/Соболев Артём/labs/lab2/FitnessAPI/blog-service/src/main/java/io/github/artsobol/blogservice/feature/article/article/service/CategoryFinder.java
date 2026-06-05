package io.github.artsobol.blogservice.feature.article.article.service;

import io.github.artsobol.blogservice.feature.article.article.entity.Category;

public interface CategoryFinder {

    Category findByIdOrThrow(Long id);
}
