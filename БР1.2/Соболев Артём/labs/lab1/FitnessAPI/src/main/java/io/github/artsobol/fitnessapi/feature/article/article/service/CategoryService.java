package io.github.artsobol.fitnessapi.feature.article.article.service;

import io.github.artsobol.fitnessapi.feature.article.article.dto.request.CreateCategoryRequest;
import io.github.artsobol.fitnessapi.feature.article.article.dto.request.UpdateCategoryRequest;
import io.github.artsobol.fitnessapi.feature.article.article.dto.response.CategoryResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface CategoryService {

    Slice<CategoryResponse> getAll(Pageable pageable);

    CategoryResponse getById(Long id);

    CategoryResponse getBySlug(String slug);

    CategoryResponse create(CreateCategoryRequest request);

    CategoryResponse update(String slug, UpdateCategoryRequest request);

    void delete(String slug);
}
