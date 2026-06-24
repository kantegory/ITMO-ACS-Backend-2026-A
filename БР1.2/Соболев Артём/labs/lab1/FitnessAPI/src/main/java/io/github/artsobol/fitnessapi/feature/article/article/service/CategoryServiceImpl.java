package io.github.artsobol.fitnessapi.feature.article.article.service;

import io.github.artsobol.fitnessapi.exception.http.ConflictException;
import io.github.artsobol.fitnessapi.exception.http.NotFoundException;
import io.github.artsobol.fitnessapi.feature.article.article.dto.request.CreateCategoryRequest;
import io.github.artsobol.fitnessapi.feature.article.article.dto.request.UpdateCategoryRequest;
import io.github.artsobol.fitnessapi.feature.article.article.dto.response.CategoryResponse;
import io.github.artsobol.fitnessapi.feature.article.article.entity.Category;
import io.github.artsobol.fitnessapi.feature.article.article.mapper.CategoryMapper;
import io.github.artsobol.fitnessapi.feature.article.article.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService, CategoryFinder {

    private final CategoryRepository repository;
    private final CategoryMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public Slice<CategoryResponse> getAll(Pageable pageable) {
        log.debug(
                "Fetching categories page={} size={} sort={}",
                pageable.getPageNumber(),
                pageable.getPageSize(),
                pageable.getSort()
        );
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getById(Long id) {
        Category entity = findByIdOrThrow(id);
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getBySlug(String slug) {
        Category entity = findBySlug(slug);
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public CategoryResponse create(CreateCategoryRequest request) {
        log.info("Creating category categorySlug={}", request.slug());
        ensureSlugNotExists(request.slug());
        Category entity = Category.create(request.name(), request.slug());
        repository.save(entity);

        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public CategoryResponse update(String categorySlug, UpdateCategoryRequest request) {
        log.info("Updating category categorySLug={}", categorySlug);
        Category entity = findBySlug(categorySlug);
        validateSlugChange(entity.getSlug(), request.slug());
        entity.applyPatch(request.name(), request.slug());

        log.info("Category updated categoryId={} categorySlug={}", entity.getId(), entity.getSlug());
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public void delete(String categorySlug) {
        log.info("Deleting category categorySlug={}", categorySlug);
        Category entity = findBySlug(categorySlug);
        repository.delete(entity);
    }

    private Category findBySlug(String categorySlug) {
        log.debug("Fetching category categorySlug={}", categorySlug);
        return repository.findBySlug(categorySlug).orElseThrow(() -> new NotFoundException("{category.slug.not.found}", categorySlug));
    }

    public Category findByIdOrThrow(Long categoryId) {
        log.debug("Fetching category categoryId={}", categoryId);
        return repository.findById(categoryId).orElseThrow(() -> new NotFoundException("{category.id.not.found}", categoryId));
    }

    private void validateSlugChange(String currentSlug, String newSlug) {
        if (newSlug != null && !currentSlug.equals(newSlug)) {
            ensureSlugNotExists(newSlug);
        }
    }

    private void ensureSlugNotExists(String categorySlug) {
        log.debug("Checking slug uniqueness categorySlug={}", categorySlug);
        if (repository.existsBySlug((categorySlug))) {
            throw new ConflictException("{category.slug.exists}", categorySlug);
        }
    }
}
