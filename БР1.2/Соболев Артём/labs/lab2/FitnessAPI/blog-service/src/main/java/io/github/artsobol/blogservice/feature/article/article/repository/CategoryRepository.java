package io.github.artsobol.blogservice.feature.article.article.repository;

import io.github.artsobol.blogservice.feature.article.article.entity.Category;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    Slice<Category> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
