package io.github.artsobol.blogservice.feature.article.article.repository;

import io.github.artsobol.blogservice.feature.article.article.entity.Article;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;


public interface ArticleRepository extends JpaRepository<Article, Long> {

    Slice<Article> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    boolean existsByIdAndAuthorId(Long articleId, Long authorId);
}